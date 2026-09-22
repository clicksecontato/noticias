import type { ArticleRow, VideoRow } from "../types";
import type { ExecutiveSummaryPayload, ExecutiveSummaryWindow } from "../types";
import { generateTopSourcesReport } from "./top-sources";
import { generateTopSubjectsReport } from "./top-subjects";

export interface ExecutiveSummaryWindowInput {
  articles: ArticleRow[];
  videos: VideoRow[];
  sourceNames: Map<string, string>;
  subjectCounts: Array<{
    subject_id: string;
    subject_name: string;
    articles: number;
    videos: number;
    total: number;
  }>;
}

function buildWindow(input: ExecutiveSummaryWindowInput): ExecutiveSummaryWindow {
  const { articles, videos, sourceNames, subjectCounts } = input;
  const total = articles.length + videos.length;
  const rssPct = total > 0 ? Math.round((articles.length / total) * 1000) / 10 : 0;
  const youtubePct = total > 0 ? Math.round((videos.length / total) * 1000) / 10 : 0;

  const topSourcesPayload = generateTopSourcesReport(
    articles,
    videos,
    sourceNames,
    { limit: 10 }
  );
  const topSubjectsPayload = generateTopSubjectsReport(subjectCounts, { limit: 10 });

  return {
    articles: articles.length,
    videos: videos.length,
    rss_vs_youtube: { rssPct, youtubePct },
    top_sources: topSourcesPayload.items,
    top_subjects: topSubjectsPayload.items,
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
