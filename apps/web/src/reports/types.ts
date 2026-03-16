/** Linha de artigo para geradores (published_at, source_id). */
export interface ArticleRow {
  published_at: string;
  source_id: string;
}

/** Linha de vídeo para geradores. */
export interface VideoRow {
  published_at: string;
  source_id: string;
}

export type GroupBy = "day" | "week" | "month";

export interface VolumePayload {
  group_by: GroupBy;
  series: Array<{
    date: string;
    label?: string;
    articles: number;
    videos: number;
  }>;
  totals: { articles: number; videos: number };
}

export interface TopSourcesPayload {
  items: Array<{
    source_id: string;
    source_name: string;
    articles: number;
    videos: number;
    total: number;
  }>;
}

/** Item do relatório por tags: quantidade de notícias por tag (sem fontes). */
export interface ByTagsPayload {
  items: Array<{
    tag_id: string;
    tag_name: string;
    count: number;
  }>;
}
