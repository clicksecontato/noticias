import type { IContentPersister } from "./content-persister.interface";
import type { ContentSourceProvider } from "../content-sources/types";
import { createArticleContentPersister } from "./article-content-persister";
import type { ArticlePersisterDeps } from "./article-content-persister";
import { createYoutubeContentPersister } from "./youtube-content-persister";
import type { YoutubePersisterDeps } from "./youtube-content-persister";

export interface ContentPersisterFactoryDeps {
  article?: ArticlePersisterDeps;
  youtube?: YoutubePersisterDeps;
}

/**
 * Factory: retorna o IContentPersister adequado ao provider.
 */
export function createContentPersister(
  provider: ContentSourceProvider,
  deps: ContentPersisterFactoryDeps = {}
): IContentPersister {
  switch (provider) {
    case "rss":
      if (!deps.article?.saveIngestedNewsItems) {
        throw new Error("createContentPersister('rss') exige deps.article.saveIngestedNewsItems");
      }
      return createArticleContentPersister(deps.article);
    case "youtube":
      if (!deps.youtube?.saveYoutubeVideos) {
        throw new Error("createContentPersister('youtube') exige deps.youtube.saveYoutubeVideos");
      }
      return createYoutubeContentPersister(deps.youtube);
    default: {
      const _: never = provider;
      throw new Error(`Provider não suportado: ${provider}`);
    }
  }
}
