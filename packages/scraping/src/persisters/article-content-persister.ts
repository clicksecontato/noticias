import type { IContentPersister } from "./content-persister.interface";
import type { ContentSource, FetchedContentItem, PersistContentResult } from "../content-sources/types";

/** Port: formato esperado pelo repositório de artigos. */
export interface SaveIngestedNewsItemsInput {
  sourceId: string;
  title: string;
  content: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface SaveIngestedNewsItemsResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
}

export interface ArticlePersisterDeps {
  saveIngestedNewsItems: (
    items: SaveIngestedNewsItemsInput[]
  ) => Promise<SaveIngestedNewsItemsResult>;
}

/**
 * Persister de artigos (RSS): mapeia FetchedContentItem → formato do repositório e delega.
 */
export function createArticleContentPersister(deps: ArticlePersisterDeps): IContentPersister {
  return {
    async persist(source: ContentSource, items: FetchedContentItem[]): Promise<PersistContentResult> {
      const input: SaveIngestedNewsItemsInput[] = items.map((item) => ({
        sourceId: source.id,
        title: item.title,
        content: item.description,
        sourceUrl: item.url,
        ...(item.imageUrl && { imageUrl: item.imageUrl })
      }));

      const result = await deps.saveIngestedNewsItems(input);

      return {
        created: result.created,
        skipped: result.skipped,
        skippedItems: result.skippedItems.map((s) => ({
          sourceId: s.sourceId,
          title: s.title,
          url: s.sourceUrl
        }))
      };
    }
  };
}
