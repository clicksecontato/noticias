/**
 * Tipos para relatórios (reports e report_results).
 */

export const REPORT_TYPES = [
  "volume",
  "top_sources",
  "by_tags",
  "activity_by_weekday",
  "executive_summary",
  "rss_vs_youtube",
  "timeline",
  "by_source_detail",
  "top_games"
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_STATUSES = ["pending", "completed", "failed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface ReportRecord {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  parameters: Record<string, unknown>;
  status: ReportStatus;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
}

export interface ReportWithResult extends ReportRecord {
  result?: { payload: Record<string, unknown> } | null;
}

export interface ReportListItem {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  generated_at: string | null;
  created_at: string;
}

/** Dado bruto para geradores: artigo no período com source. */
export interface ArticleRowForReport {
  published_at: string;
  source_id: string;
}

/** Dado bruto para geradores: vídeo no período. */
export interface VideoRowForReport {
  published_at: string;
  source_id: string;
}
