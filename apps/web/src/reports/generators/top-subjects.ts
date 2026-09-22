import type { TopSubjectsPayload } from "../types";

export interface SubjectCountRow {
  subject_id: string;
  subject_name: string;
  articles: number;
  videos: number;
  total: number;
}

export function generateTopSubjectsReport(
  subjectCounts: SubjectCountRow[],
  options: { limit?: number } = {}
): TopSubjectsPayload {
  const limit = options.limit ?? 20;
  const items = subjectCounts.slice(0, limit);
  return { items };
}
