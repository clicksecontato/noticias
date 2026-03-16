import type { ArticleRow, VideoRow } from "../types";
import type { ExecutiveSummaryPayload, ExecutiveSummaryWindow } from "../types";
import { generateTopSourcesReport } from "./top-sources";
import { generateTopGamesReport } from "./top-games";

export interface ExecutiveSummaryWindowInput {
  articles: ArticleRow[];
  videos: VideoRow[];
  sourceNames: Map<string, string>;
  gameCounts: Array<{
    game_id: string;
    game_name: string;
    articles: number;
    videos: number;
    total: number;
  }>;
}

function buildWindow(input: ExecutiveSummaryWindowInput): ExecutiveSummaryWindow {
  const { articles, videos, sourceNames, gameCounts } = input;
  const total = articles.length + videos.length;
  const rssPct = total > 0 ? Math.round((articles.length / total) * 1000) / 10 : 0;
  const youtubePct = total > 0 ? Math.round((videos.length / total) * 1000) / 10 : 0;

  const topSourcesPayload = generateTopSourcesReport(
    articles,
    videos,
    sourceNames,
    { limit: 10 }
  );
  const topGamesPayload = generateTopGamesReport(gameCounts, { limit: 10 });

  return {
    articles: articles.length,
    videos: videos.length,
    rss_vs_youtube: { rssPct, youtubePct },
    top_sources: topSourcesPayload.items,
    top_games: topGamesPayload.items,
  };
}

export function generateExecutiveSummaryReport(
  referenceDate: string,
  window7: ExecutiveSummaryWindowInput,
  window30: ExecutiveSummaryWindowInput,
  window90: ExecutiveSummaryWindowInput
): ExecutiveSummaryPayload {
  return {
    reference_date: referenceDate,
    last_7_days: buildWindow(window7),
    last_30_days: buildWindow(window30),
    last_90_days: buildWindow(window90),
  };
}
