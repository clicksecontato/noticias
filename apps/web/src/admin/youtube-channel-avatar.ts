import { recordYoutubeApiCall } from "./youtube-api-quota-repository";

export type YoutubeChannelSnippetThumbnails = {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
};

/** Escolhe a melhor URL de thumbnail do snippet do canal. */
export function pickYoutubeChannelThumbnailUrl(
  thumbnails: YoutubeChannelSnippetThumbnails | null | undefined
): string | null {
  if (!thumbnails) return null;
  const url =
    thumbnails.high?.url?.trim() ||
    thumbnails.medium?.url?.trim() ||
    thumbnails.default?.url?.trim() ||
    "";
  return url || null;
}

export type YoutubeChannelProfile = {
  channelId: string;
  imageUrl: string | null;
  title: string | null;
};

type ChannelsListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      thumbnails?: YoutubeChannelSnippetThumbnails;
    };
  }>;
  error?: { message?: string };
};

/**
 * Busca perfil do canal (avatar + título) via channels.list part=snippet.
 * Aceita channel ID (UC...) ou deixa o caller resolver handle antes.
 */
export async function fetchYoutubeChannelProfile(
  apiKey: string,
  channelId: string,
  fetchImpl: typeof fetch = fetch
): Promise<YoutubeChannelProfile> {
  const id = channelId.trim();
  if (!id.startsWith("UC") || id.length < 24) {
    throw new Error("channelId inválido; esperado UC…");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", id);
  url.searchParams.set("key", apiKey);

  void recordYoutubeApiCall("channels.list", `avatar:${id}`);
  const res = await fetchImpl(url.toString());
  const data = (await res.json()) as ChannelsListResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || `YouTube API HTTP ${res.status}`);
  }
  const item = data.items?.[0];
  if (!item?.id) {
    throw new Error(`Canal não encontrado: ${id}`);
  }
  return {
    channelId: item.id,
    imageUrl: pickYoutubeChannelThumbnailUrl(item.snippet?.thumbnails),
    title: item.snippet?.title?.trim() || null,
  };
}
