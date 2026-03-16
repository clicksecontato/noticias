import type { ByTagsPayload } from "../types";

export interface TagCountRow {
  tag_id: string;
  tag_name: string;
  count: number;
}

export function generateByTagsReport(
  tagCounts: TagCountRow[],
  options: { limit?: number } = {}
): ByTagsPayload {
  const limit = options.limit ?? 100;
  const items = tagCounts.slice(0, limit);
  return { items };
}
