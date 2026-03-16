import type { ReportType } from "../../../../packages/database/src/report-types";
import type { ArticleRow, VideoRow } from "./types";
import { generateVolumeReport } from "./generators/volume";
import { generateTopSourcesReport } from "./generators/top-sources";
import { generateByTagsReport } from "./generators/by-tags";

export interface ReportDataInput {
  articles: ArticleRow[];
  videos: VideoRow[];
  sourceNames: Map<string, string>;
  /** Contagem de notícias por tag (para relatório by_tags). */
  tagCounts?: Array<{ tag_id: string; tag_name: string; count: number }>;
}

export interface GenerateReportOptions {
  group_by?: "day" | "week" | "month";
  limit_sources?: number;
  limit_tags?: number;
}

/**
 * Gera o payload do relatório a partir dos dados brutos (sem persistência).
 */
export function generateReportPayload(
  reportType: ReportType,
  data: ReportDataInput,
  options: GenerateReportOptions = {}
): Record<string, unknown> {
  const { articles, videos, sourceNames, tagCounts } = data;
  switch (reportType) {
    case "volume":
      return generateVolumeReport(articles, videos, {
        group_by: options.group_by ?? "day"
      }) as unknown as Record<string, unknown>;
    case "top_sources":
      return generateTopSourcesReport(articles, videos, sourceNames, {
        limit: options.limit_sources ?? 50
      }) as unknown as Record<string, unknown>;
    case "by_tags": {
      const counts = tagCounts ?? [];
      return generateByTagsReport(counts, {
        limit: options.limit_tags ?? 100
      }) as unknown as Record<string, unknown>;
    }
    default:
      throw new Error(`Report type not implemented: ${reportType}`);
  }
}

export const SUPPORTED_REPORT_TYPES: ReportType[] = ["volume", "top_sources", "by_tags"];
