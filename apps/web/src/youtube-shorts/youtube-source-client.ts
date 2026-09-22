import type { YoutubeVideoSnapshot } from "./contracts";

interface YoutubeVideoDetailsResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
    };
  }>;
}

export async function getYoutubeVideoSnapshot(
  videoId: string,
  apiKey: string
): Promise<YoutubeVideoSnapshot> {
  if (!apiKey.trim()) {
    throw new Error("YOUTUBE_API_KEY não configurada.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao consultar YouTube API: ${response.status}`);
  }

  const data = (await response.json()) as YoutubeVideoDetailsResponse;
  const item = data.items?.[0];
  if (!item?.id || !item.snippet?.title) {
    throw new Error("Vídeo não encontrado no YouTube.");
  }

  return {
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? "",
    channelTitle: item.snippet.channelTitle ?? "",
    canonicalUrl: `https://www.youtube.com/watch?v=${item.id}`,
  };
}
