import type { ArticleRow, VideoRow, TopSourcesPayload } from "../types";

export function generateTopSourcesReport(
  articles: ArticleRow[],
  videos: VideoRow[],
  sourceNames: Map<string, string>,
  options: { limit?: number } = {}
): TopSourcesPayload {
  const limit = options.limit ?? 50;
  const bySource = new Map<string, { articles: number; videos: number }>();

  for (const a of articles) {
    const cur = bySource.get(a.source_id) ?? { articles: 0, videos: 0 };
    cur.articles += 1;
    bySource.set(a.source_id, cur);
  }
  for (const v of videos) {
    const cur = bySource.get(v.source_id) ?? { articles: 0, videos: 0 };
    cur.videos += 1;
    bySource.set(v.source_id, cur);
  }

  const items = Array.from(bySource.entries())
    .map(([source_id, counts]) => ({
      source_id,
      source_name: sourceNames.get(source_id) ?? source_id,
      articles: counts.articles,
      videos: counts.videos,
      total: counts.articles + counts.videos
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return { items };
}
