import type { ReportType } from "../../../../packages/database/src/report-types";
import type { ArticleRow, VideoRow } from "./types";
import { generateVolumeReport } from "./generators/volume";
import { generateTopSourcesReport } from "./generators/top-sources";
import { generateByTagsReport } from "./generators/by-tags";
import { generateActivityByWeekdayReport } from "./generators/activity-by-weekday";
import { generateTopSubjectsReport } from "./generators/top-subjects";
import { generateRadarPautaReport } from "./generators/radar-pauta";
import { generateMapaTematicoReport } from "./generators/mapa-tematico";

export interface ReportDataInput {
  articles: ArticleRow[];
  videos: VideoRow[];
  sourceNames: Map<string, string>;
  tagCounts?: Array<{ tag_id: string; tag_name: string; count: number }>;
  sourceId?: string;
  subjectCounts?: Array<{
    subject_id: string;
    subject_name: string;
    subject_slug?: string;
    articles: number;
    videos: number;
    total: number;
  }>;
  previousSubjectCounts?: Array<{
    subject_id: string;
    subject_name: string;
    subject_slug?: string;
    articles: number;
    videos: number;
    total: number;
  }>;
  periodStart?: string;
  periodEnd?: string;
}

export interface GenerateReportOptions {
  group_by?: "day" | "week" | "month";
  limit_sources?: number;
  limit_tags?: number;
  limit_subjects?: number;
}

/**
 * Gera o payload do relatório a partir dos dados brutos (sem persistência).
 */
export function generateReportPayload(
  reportType: ReportType,
  data: ReportDataInput,
  options: GenerateReportOptions = {}
): Record<string, unknown> {
  const {
    articles,
    videos,
    sourceNames,
    tagCounts,
    sourceId,
    subjectCounts,
    previousSubjectCounts,
    periodStart,
    periodEnd,
  } = data;
  switch (reportType) {
    case "volume":
      return generateVolumeReport(articles, videos, {
        group_by: options.group_by ?? "day"
      }) as unknown as Record<string, unknown>;
    case "top_sources":
      return generateTopSourcesReport(articles, videos, sourceNames, {
        limit: options.limit_sources ?? 50
      }) as unknown as Record<string, unknown>;
    case "activity_by_weekday":
      return generateActivityByWeekdayReport(
        articles,
        videos
      ) as unknown as Record<string, unknown>;
    case "by_tags": {
      const counts = tagCounts ?? [];
      return generateByTagsReport(counts, {
        limit: options.limit_tags ?? 100
      }) as unknown as Record<string, unknown>;
    }
    case "by_source_detail": {
      if (!sourceId) {
        throw new Error("by_source_detail requer sourceId nos dados");
      }
      const sourceName = sourceNames.get(sourceId) ?? sourceId;
      const tags = tagCounts ?? [];
      return {
        source_id: sourceId,
        source_name: sourceName,
        articles_total: articles.length,
        videos_total: videos.length,
        tags,
      } as Record<string, unknown>;
    }
    case "top_subjects": {
      const counts = subjectCounts ?? [];
      return generateTopSubjectsReport(counts, {
        limit: options.limit_subjects ?? 20,
      }) as unknown as Record<string, unknown>;
    }
    case "radar_pauta": {
      if (!periodStart || !periodEnd) {
        throw new Error("radar_pauta requer periodStart e periodEnd nos dados");
      }
      return generateRadarPautaReport(
        subjectCounts ?? [],
        previousSubjectCounts ?? [],
        {
          periodStart,
          periodEnd,
          limit: options.limit_subjects ?? 20,
        }
      ) as unknown as Record<string, unknown>;
    }
    case "mapa_tematico": {
      if (!periodStart || !periodEnd) {
        throw new Error("mapa_tematico requer periodStart e periodEnd nos dados");
      }
      return generateMapaTematicoReport(subjectCounts ?? [], {
        periodStart,
        periodEnd,
        limit_subjects: options.limit_subjects ?? 8,
      }) as unknown as Record<string, unknown>;
    }
    default:
      throw new Error(`Report type not implemented: ${reportType}`);
  }
}

export const SUPPORTED_REPORT_TYPES: ReportType[] = [
  "volume",
  "top_sources",
  "by_tags",
  "activity_by_weekday",
  "by_source_detail",
  "top_subjects",
  "radar_pauta",
  "mapa_tematico",
  "executive_summary",
  "month_presentation",
];
