import type { ReportType } from "../../../../packages/database/src/report-types";
import type { ArticleRow, VideoRow } from "./types";
import { generateVolumeReport } from "./generators/volume";
import { generateTopSourcesReport } from "./generators/top-sources";

export interface ReportDataInput {
  articles: ArticleRow[];
  videos: VideoRow[];
  sourceNames: Map<string, string>;
}

export interface GenerateReportOptions {
  group_by?: "day" | "week" | "month";
  limit_sources?: number;
}

/**
 * Gera o payload do relatório a partir dos dados brutos (sem persistência).
 */
export function generateReportPayload(
  reportType: ReportType,
  data: ReportDataInput,
  options: GenerateReportOptions = {}
): Record<string, unknown> {
  const { articles, videos, sourceNames } = data;
  switch (reportType) {
    case "volume":
      return generateVolumeReport(articles, videos, {
        group_by: options.group_by ?? "day"
      }) as unknown as Record<string, unknown>;
    case "top_sources":
      return generateTopSourcesReport(articles, videos, sourceNames, {
        limit: options.limit_sources ?? 50
      }) as unknown as Record<string, unknown>;
    default:
      throw new Error(`Report type not implemented: ${reportType}`);
  }
}

export const SUPPORTED_REPORT_TYPES: ReportType[] = ["volume", "top_sources"];
