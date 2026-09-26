export interface ThumbVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
}

export interface ThumbChannel {
  source_id: string;
  source_name: string;
  videos: ThumbVideo[];
}

export interface ThumbsPayload {
  channels: ThumbChannel[];
}

export interface ThumbSourceVideo {
  id?: string;
  video_id?: string | null;
  title?: string | null;
  thumbnail_url?: string | null;
  published_at: string;
  source_id: string;
}

/** Miniatura grande o bastante para comparar o padrão visual do criador. */
export function youtubeThumbUrl(videoId: string | null | undefined, stored: string | null | undefined): string | null {
  const id = videoId?.trim();
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const url = stored?.trim();
  return url || null;
}

/** Uma grade por canal: vídeos mais recentes primeiro e canais com mais thumbs na frente. */
export function buildThumbsPayload(
  videos: ThumbSourceVideo[],
  sourceNames: Map<string, string>
): ThumbsPayload {
  const bySource = new Map<string, ThumbVideo[]>();
  for (const video of videos) {
    const id = video.id?.trim();
    const thumbnailUrl = youtubeThumbUrl(video.video_id, video.thumbnail_url);
    if (!id || !video.source_id || !thumbnailUrl) continue;
    const list = bySource.get(video.source_id) ?? [];
    list.push({
      id,
      title: video.title?.trim() || "Sem título",
      thumbnail_url: thumbnailUrl,
      published_at: video.published_at,
    });
    bySource.set(video.source_id, list);
  }

  const channels = [...bySource.entries()].map(([sourceId, items]) => ({
    source_id: sourceId,
    source_name: sourceNames.get(sourceId) ?? sourceId,
    videos: [...items].sort((a, b) => b.published_at.localeCompare(a.published_at)),
  }));

  channels.sort(
    (a, b) => b.videos.length - a.videos.length || a.source_name.localeCompare(b.source_name, "pt")
  );

  return { channels };
}
