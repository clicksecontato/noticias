import type { ContentSource, FetchedContentItem } from "../content-sources/types";

/**
 * Interface para buscar itens de uma fonte (RSS, YouTube, etc.).
 * Single Responsibility: apenas buscar; persistência é responsabilidade do persister.
 */
export interface IContentFetcher {
  /** Busca itens da fonte. Lança se a fonte não for do tipo suportado. */
  fetch(source: ContentSource): Promise<FetchedContentItem[]>;
}
