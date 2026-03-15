/**
 * Tipos para fontes de conteúdo multi-provider (rss, youtube).
 * Alinhado com packages/scraping/content-sources/types; mantido no database para evitar dependência circular.
 */

export const SOURCE_PROVIDERS = ["rss", "youtube"] as const;
export type SourceProvider = (typeof SOURCE_PROVIDERS)[number];

export interface ContentSourceRecord {
  id: string;
  name: string;
  language: string;
  provider: SourceProvider;
  rssUrl?: string | null;
  channelId?: string | null;
  isActive: boolean;
}

export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  thumbnailUrl?: string | null;
}

export interface SaveYoutubeVideosResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; url?: string }>;
}

/** Vídeo para exibição na seção Vídeos (listagem pública). */
export interface YoutubeVideoDisplay {
  id: string;
  sourceId: string;
  sourceName: string;
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  url: string;
}
