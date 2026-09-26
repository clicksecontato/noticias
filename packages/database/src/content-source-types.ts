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
  /** Avatar/logo (YouTube channel thumbnail ou futuro RSS). */
  imageUrl?: string | null;
  isActive: boolean;
  /** ISO timestamp da última tentativa de ingestão. */
  lastIngestedAt?: string | null;
  /** Wall-clock da última ingestão em ms. */
  lastIngestionDurationMs?: number | null;
}

export interface SourceIngestionTimingUpdate {
  lastIngestedAt: string;
  durationMs: number;
}

/** Metadados públicos de vídeo de terceiro. Espelha o contrato do fetcher YouTube. */
export interface YoutubePublicMetadata {
  durationSeconds: number | null;
  creatorTags: string[];
  liveBroadcastContent: "none" | "live" | "upcoming" | null;
  defaultAudioLanguage: string | null;
  hasCaptions: boolean | null;
  topicCategories: string[];
  youtubeCategoryId: string | null;
}

export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  thumbnailUrl?: string | null;
  youtube?: YoutubePublicMetadata;
}

/** Colunas de metadados públicos gravadas em youtube_videos. */
export function youtubeMetadataToRow(metadata: YoutubePublicMetadata | undefined): {
  duration_seconds: number | null;
  creator_tags: string[];
  live_broadcast_content: string | null;
  default_audio_language: string | null;
  has_captions: boolean | null;
  topic_categories: string[];
  youtube_category_id: string | null;
} {
  return {
    duration_seconds: metadata?.durationSeconds ?? null,
    creator_tags: metadata?.creatorTags ?? [],
    live_broadcast_content: metadata?.liveBroadcastContent ?? null,
    default_audio_language: metadata?.defaultAudioLanguage ?? null,
    has_captions: metadata?.hasCaptions ?? null,
    topic_categories: metadata?.topicCategories ?? [],
    youtube_category_id: metadata?.youtubeCategoryId ?? null,
  };
}

export interface SaveYoutubeVideosResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; url?: string }>;
}

export interface YoutubeVideoListOptions {
  limit?: number;
  offset?: number;
  sourceId?: string;
  sourceIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  durationBand?: "short" | "medium" | "long";
  audioLanguage?: "pt" | "en";
}

/** Vídeo para exibição na seção Vídeos (listagem pública). */
export interface YoutubeVideoDisplay {
  id: string;
  sourceId: string;
  sourceName: string;
  /** Avatar da fonte (canal YouTube). */
  sourceImageUrl?: string | null;
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  url: string;
  durationSeconds?: number | null;
  defaultAudioLanguage?: string | null;
  hasCaptions?: boolean | null;
  /** Nomes de assuntos/tags/tipos vinculados (enriquecimento). */
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
}
