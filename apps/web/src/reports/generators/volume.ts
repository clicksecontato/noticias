import type { ArticleRow, VideoRow, GroupBy, VolumePayload } from "../types";

function toDateKey(date: Date, groupBy: GroupBy): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  if (groupBy === "day") return `${y}-${m}-${d}`;
  if (groupBy === "week") {
    const jan1 = new Date(Date.UTC(y, 0, 1));
    const weekNum = Math.ceil((((date.getTime() - jan1.getTime()) / 86400000) + jan1.getUTCDay() + 1) / 7);
    return `${y}-W${String(weekNum).padStart(2, "0")}`;
  }
  return `${y}-${m}`;
}

export function generateVolumeReport(
  articles: ArticleRow[],
  videos: VideoRow[],
  options: { group_by?: GroupBy } = {}
): VolumePayload {
  const groupBy = options.group_by ?? "day";
  const articlesByKey = new Map<string, number>();
  const videosByKey = new Map<string, number>();

  for (const a of articles) {
    const date = new Date(a.published_at);
    const key = toDateKey(date, groupBy);
    articlesByKey.set(key, (articlesByKey.get(key) ?? 0) + 1);
  }
  for (const v of videos) {
    const date = new Date(v.published_at);
    const key = toDateKey(date, groupBy);
    videosByKey.set(key, (videosByKey.get(key) ?? 0) + 1);
  }

  const allKeys = new Set([...articlesByKey.keys(), ...videosByKey.keys()]);
  const sortedKeys = Array.from(allKeys).sort();

  const series = sortedKeys.map((key) => ({
    date: key,
    label: groupBy === "day" ? key : key,
    articles: articlesByKey.get(key) ?? 0,
    videos: videosByKey.get(key) ?? 0
  }));

  const totals = {
    articles: articles.length,
    videos: videos.length
  };

  return { group_by: groupBy, series, totals };
}
