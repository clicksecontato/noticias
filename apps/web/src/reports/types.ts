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

export interface ActivityByWeekdayPayload {
  items: Array<{
    weekday: number; // 0 = domingo ... 6 = sábado
    label: string;
    articles: number;
    videos: number;
    total: number;
  }>;
}

/** Item do relatório top jogos: quantidade de artigos e vídeos por jogo no período. */
export interface TopGamesPayload {
  items: Array<{
    game_id: string;
    game_name: string;
    articles: number;
    videos: number;
    total: number;
  }>;
}

/** Uma janela do resumo executivo (ex.: últimos 7 dias). */
export interface ExecutiveSummaryWindow {
  articles: number;
  videos: number;
  rss_vs_youtube: { rssPct: number; youtubePct: number };
  top_sources: TopSourcesPayload["items"];
  top_games: TopGamesPayload["items"];
}

/** Resumo executivo: 3 janelas fixas (7, 30, 90 dias). */
export interface ExecutiveSummaryPayload {
  reference_date: string;
  last_7_days: ExecutiveSummaryWindow;
  last_30_days: ExecutiveSummaryWindow;
  last_90_days: ExecutiveSummaryWindow;
}
