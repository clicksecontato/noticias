import type { IContentFetcher } from "./content-fetcher.interface";
import type { ContentSourceProvider } from "../content-sources/types";
import { createRssContentFetcher } from "./rss-content-fetcher";
import type { RssFetcherDeps } from "./rss-content-fetcher";
import { createYoutubeContentFetcher } from "./youtube-content-fetcher";
import type { YoutubeFetcherDeps } from "./youtube-content-fetcher";

export interface ContentFetcherFactoryDeps {
  rss?: RssFetcherDeps;
  youtube?: YoutubeFetcherDeps;
}

/**
 * Factory: retorna o IContentFetcher adequado ao provider (Open/Closed: novo provider = novo fetcher).
 */
export function createContentFetcher(
  provider: ContentSourceProvider,
  deps: ContentFetcherFactoryDeps = {}
): IContentFetcher {
  switch (provider) {
    case "rss":
      return createRssContentFetcher(deps.rss ?? {});
    case "youtube":
      if (!deps.youtube?.apiKey) {
        throw new Error("createContentFetcher('youtube') exige deps.youtube com apiKey");
      }
      return createYoutubeContentFetcher(deps.youtube);
    default: {
      const _: never = provider;
      throw new Error(`Provider não suportado: ${provider}`);
    }
  }
}
