import type { ContentSource, FetchedContentItem, PersistContentResult } from "../content-sources/types";

/**
 * Interface para persistir itens agregados (artigos ou vídeos).
 * Cada provider tem seu persister (artigos -> DB articles, vídeos -> youtube_videos).
 */
export interface IContentPersister {
  /** Persiste itens da fonte. Retorna quantos foram criados e quantos já existiam. */
  persist(source: ContentSource, items: FetchedContentItem[]): Promise<PersistContentResult>;
}
