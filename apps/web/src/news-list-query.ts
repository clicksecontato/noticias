import type { NewsSortMode } from "./content-provider";

export interface NewsListParams {
  page: number;
  sourceId: string;
  query: string;
  sortMode: NewsSortMode;
}

export interface BuildNewsQueryInput extends NewsListParams {
  basePath: string;
}

export function parseNewsListParams(searchParams: {
  page?: string;
  source?: string;
  q?: string;
  sort?: string;
}): NewsListParams {
  const pageParam = Number.parseInt(searchParams.page || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const sourceId = (searchParams.source || "").trim();
  const query = (searchParams.q || "").trim();
  const sortMode: NewsSortMode =
    searchParams.sort === "published_asc" ? "published_asc" : "published_desc";

  return {
    page,
    sourceId,
    query,
    sortMode
  };
}

export function buildNewsQueryPath(input: BuildNewsQueryInput): string {
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  if (input.sourceId) {
    params.set("source", input.sourceId);
  }
  if (input.query) {
    params.set("q", input.query);
  }
  params.set("sort", input.sortMode);
  return `${input.basePath}?${params.toString()}`;
}
