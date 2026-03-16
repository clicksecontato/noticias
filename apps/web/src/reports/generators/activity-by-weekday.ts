import type { ActivityByWeekdayPayload, ArticleRow, VideoRow } from "../types";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function generateActivityByWeekdayReport(
  articles: ArticleRow[],
  videos: VideoRow[]
): ActivityByWeekdayPayload {
  const counts: ActivityByWeekdayPayload["items"] = WEEKDAY_LABELS.map(
    (label, weekday) => ({
      weekday,
      label,
      articles: 0,
      videos: 0,
      total: 0,
    })
  );

  for (const a of articles) {
    const d = new Date(a.published_at);
    const w = d.getUTCDay(); // 0 (Dom) - 6 (Sáb)
    if (w >= 0 && w <= 6) {
      counts[w].articles += 1;
    }
  }

  for (const v of videos) {
    const d = new Date(v.published_at);
    const w = d.getUTCDay();
    if (w >= 0 && w <= 6) {
      counts[w].videos += 1;
    }
  }

  for (const c of counts) {
    c.total = c.articles + c.videos;
  }

  return { items: counts };
}

