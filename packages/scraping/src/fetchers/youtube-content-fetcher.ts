import type { IContentFetcher } from "./content-fetcher.interface";
import type { ContentSource, FetchedContentItem } from "../content-sources/types";

export interface YoutubeFetcherDeps {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  maxResults?: number;
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

interface PlaylistItem {
  id?: string;
  snippet?: PlaylistItemSnippet;
}

interface PlaylistItemsResponse {
  items?: PlaylistItem[];
  error?: { message?: string; code?: number };
}

export function createYoutubeContentFetcher(deps: YoutubeFetcherDeps): IContentFetcher {
  const { apiKey, fetch: fetchFn = fetch, maxResults = 15 } = deps;

  return {
    async fetch(source: ContentSource): Promise<FetchedContentItem[]> {
      if (source.provider !== "youtube") {
        throw new Error("YouTube fetcher exige provider 'youtube'");
      }
      if (!source.channelId?.trim()) {
        throw new Error("channelId é obrigatório para fonte YouTube");
      }

      const playlistId = getUploadsPlaylistId(source.channelId.trim());
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("playlistId", playlistId);
      url.searchParams.set("maxResults", String(maxResults));
      url.searchParams.set("key", apiKey);

      const response = await fetchFn(url.toString());
      const data = (await response.json()) as PlaylistItemsResponse;

      if (!response.ok) {
        const msg = data.error?.message || `HTTP ${response.status}`;
        throw new Error(`YouTube API failed: ${msg}`);
      }

      const items = data.items ?? [];
      return items
        .filter((item): item is PlaylistItem & { snippet: PlaylistItemSnippet } => !!item.snippet?.resourceId?.videoId)
        .map((item) => {
          const s = item.snippet;
          const videoId = s.resourceId.videoId;
          const thumb =
            s.thumbnails?.medium?.url ?? s.thumbnails?.high?.url ?? s.thumbnails?.default?.url;
          return {
            externalId: videoId,
            title: s.title || "",
            description: s.description || "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            publishedAt: s.publishedAt,
            imageUrl: thumb,
            contentType: "video" as const
          };
        });
    }
  };
}
