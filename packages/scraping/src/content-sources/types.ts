/**
 * Tipos para agregador multi-fonte (RSS, YouTube, futuros).
 * Flag de provider permite tratar cada fonte pelo canal adequado (API YouTube, RSS, etc.).
 */

export const CONTENT_SOURCE_PROVIDERS = ["rss", "youtube"] as const;
export type ContentSourceProvider = (typeof CONTENT_SOURCE_PROVIDERS)[number];

export function isContentSourceProvider(value: string): value is ContentSourceProvider {
  return CONTENT_SOURCE_PROVIDERS.includes(value as ContentSourceProvider);
}

/** Fonte de conteúdo (RSS ou YouTube, etc.) com discriminator provider. */
export interface ContentSource {
  id: string;
  name: string;
  language: string;
  provider: ContentSourceProvider;
  /** Obrigatório quando provider === "rss". */
  rssUrl?: string;
  /** Obrigatório quando provider === "youtube". ID do canal (ex.: UC...). */
  channelId?: string;
  isActive: boolean;
}

/** Item de conteúdo agregado (artigo ou vídeo) em formato unificado. */
export interface FetchedContentItem {
  externalId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  /** "article" | "video" para relatórios. */
  contentType: "article" | "video";
}

/** Métricas do fetch por fonte (observabilidade da ingestão). */
export interface IngestionFetchStats {
  provider: ContentSourceProvider;
  /** RSS: itens com elemento title no feed. */
  rssItemsWithTitle?: number;
  /** RSS: descartados pela janela de pubDate. */
  rssItemsFilteredByDate?: number;
  /** RSS: com título mas sem link válido após parse. */
  rssItemsDroppedNoLink?: number;
  /** RSS: cortados pelo teto maxItems após filtros. */
  rssItemsCappedByMaxItems?: number;
  /** RSS: entregues ao persister. */
  rssItemsDelivered?: number;
  /** YouTube: linhas retornadas pela API playlistItems. */
  youtubePlaylistItemsRaw?: number;
  /** YouTube: sem snippet/videoId válido. */
  youtubeItemsDroppedInvalid?: number;
  /** YouTube: entregues ao persister. */
  youtubeItemsDelivered?: number;
  /** Wall-clock da rodada (fetch + persist) em milissegundos. */
  durationMs?: number;
}

/** Resultado do fetcher: itens + estatísticas para logs e API admin. */
export interface ContentFetchOutcome {
  items: FetchedContentItem[];
  stats: IngestionFetchStats;
}

/** Resultado da persistência por fonte (criados, ignorados, itens já existentes). */
export interface PersistContentResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; url?: string }>;
  /** Estatísticas do fetch da mesma rodada (quando disponível). */
  fetchStats?: IngestionFetchStats;
}
