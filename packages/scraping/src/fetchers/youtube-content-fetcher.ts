import type { IContentFetcher } from "./content-fetcher.interface";
import type {
  ContentFetchOutcome,
  ContentSource,
  FetchedContentItem,
  YoutubePublicMetadata,
} from "../content-sources/types";
import { parseYoutubeDurationSeconds } from "./youtube-duration";

export interface YoutubeFetcherDeps {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  maxResults?: number;
  /** Chamado a cada request à YouTube Data API (para tracking de cota). */
  onApiCall?: (method: "playlistItems.list" | "videos.list") => void;
}

/**
 * Converte channel ID (UC...) no ID da playlist de uploads (UU...).
 * Regra: UC + suffix -> UU + suffix. Ver documentação da API channels#contentDetails.relatedPlaylists.uploads.
 */
function getUploadsPlaylistId(channelId: string): string {
  const trimmed = channelId.trim();
  if (trimmed.startsWith("UC") && trimmed.length > 2) {
    return "UU" + trimmed.slice(2);
  }
  return trimmed;
}

/** Resposta mínima esperada da API playlistItems. */
interface PlaylistItemSnippet {
  title: string;
  description: string;
  publishedAt: string;
  resourceId: { videoId: string };
  thumbnails?: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}

interface PlaylistItemContentDetails {
  videoPublishedAt?: string;
}

interface PlaylistItem {
  id?: string;
  snippet?: PlaylistItemSnippet;
  contentDetails?: PlaylistItemContentDetails;
}

type LiveBroadcastContent = YoutubePublicMetadata["liveBroadcastContent"];

interface VideosListItem {
  id?: string;
  snippet?: {
    tags?: string[];
    categoryId?: string;
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
    liveBroadcastContent?: string;
  };
  contentDetails?: {
    duration?: string;
    caption?: string;
  };
  topicDetails?: {
    topicCategories?: string[];
  };
}

function asLiveBroadcast(value: string | undefined): LiveBroadcastContent {
  if (value === "none" || value === "live" || value === "upcoming") return value;
  return null;
}

function mapVideoMetadata(item: VideosListItem | undefined): YoutubePublicMetadata {
  const snippet = item?.snippet;
  const caption = item?.contentDetails?.caption;
  return {
    durationSeconds: parseYoutubeDurationSeconds(item?.contentDetails?.duration),
    creatorTags: snippet?.tags ?? [],
    liveBroadcastContent: asLiveBroadcast(snippet?.liveBroadcastContent),
    defaultAudioLanguage: snippet?.defaultAudioLanguage ?? snippet?.defaultLanguage ?? null,
    hasCaptions: caption === "true" ? true : caption === "false" ? false : null,
    topicCategories: item?.topicDetails?.topicCategories ?? [],
    youtubeCategoryId: snippet?.categoryId ?? null,
  };
}

interface PlaylistItemsResponse {
  items?: PlaylistItem[];
  error?: { message?: string; code?: number };
}

interface VideosListResponse {
  items?: VideosListItem[];
  error?: { message?: string; code?: number };
}

export async function fetchYoutubePublicMetadataByIds(
  videoIds: string[],
  deps: {
    apiKey: string;
    fetch?: typeof globalThis.fetch;
    onApiCall?: YoutubeFetcherDeps["onApiCall"];
  }
): Promise<Map<string, YoutubePublicMetadata>> {
  return fetchVideoMetadata(
    videoIds,
    deps.apiKey,
    deps.fetch ?? fetch,
    deps.onApiCall
  );
}

async function fetchVideoMetadata(
  videoIds: string[],
  apiKey: string,
  fetchFn: typeof globalThis.fetch,
  onApiCall: YoutubeFetcherDeps["onApiCall"]
): Promise<Map<string, YoutubePublicMetadata>> {
  const byId = new Map<string, YoutubePublicMetadata>();
  if (videoIds.length === 0) return byId;

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,topicDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  onApiCall?.("videos.list");
  const response = await fetchFn(url.toString());
  const data = (await response.json()) as VideosListResponse;
  if (!response.ok) {
    const msg = data.error?.message || `HTTP ${response.status}`;
    throw new Error(`YouTube API failed: ${msg}`);
  }

  for (const item of data.items ?? []) {
    if (!item.id) continue;
    byId.set(item.id, mapVideoMetadata(item));
  }
  return byId;
}

export function createYoutubeContentFetcher(deps: YoutubeFetcherDeps): IContentFetcher {
  const { apiKey, fetch: fetchFn = fetch, maxResults = 15, onApiCall } = deps;

  return {
    async fetch(source: ContentSource): Promise<ContentFetchOutcome> {
      if (source.provider !== "youtube") {
        throw new Error("YouTube fetcher exige provider 'youtube'");
      }
      if (!source.channelId?.trim()) {
        throw new Error("channelId é obrigatório para fonte YouTube");
      }

      const playlistId = getUploadsPlaylistId(source.channelId.trim());
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet,contentDetails");
      url.searchParams.set("playlistId", playlistId);
      url.searchParams.set("maxResults", String(maxResults));
      url.searchParams.set("key", apiKey);

      onApiCall?.("playlistItems.list");
      const response = await fetchFn(url.toString());
      const data = (await response.json()) as PlaylistItemsResponse;

      if (!response.ok) {
        const msg = data.error?.message || `HTTP ${response.status}`;
        throw new Error(`YouTube API failed: ${msg}`);
      }

      const rawItems = data.items ?? [];
      const playable = rawItems.filter(
        (item): item is PlaylistItem & { snippet: PlaylistItemSnippet } =>
          !!item.snippet?.resourceId?.videoId
      );
      const metadataById = await fetchVideoMetadata(
        playable.map((item) => item.snippet.resourceId.videoId),
        apiKey,
        fetchFn,
        onApiCall
      );
      const items: FetchedContentItem[] = playable.map((item) => {
          const s = item.snippet;
          const videoId = s.resourceId.videoId;
          const thumb =
            s.thumbnails?.medium?.url ?? s.thumbnails?.high?.url ?? s.thumbnails?.default?.url;
          const publishedAt = item.contentDetails?.videoPublishedAt || s.publishedAt;
          return {
            externalId: videoId,
            title: s.title || "",
            description: s.description || "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            publishedAt,
            imageUrl: thumb,
            contentType: "video" as const,
            youtube: metadataById.get(videoId) ?? mapVideoMetadata(undefined),
          };
        });

      const stats = {
        provider: "youtube" as const,
        youtubePlaylistItemsRaw: rawItems.length,
        youtubeItemsDroppedInvalid: rawItems.length - items.length,
        youtubeItemsDelivered: items.length
      };

      return { items, stats };
    }
  };
}
