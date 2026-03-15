import type { IContentFetcher } from "./content-fetcher.interface";
import type { ContentSource, FetchedContentItem } from "../content-sources/types";
import { fetchRssItemsBySource } from "../rss-fetcher";
import type { SourceInput, RawNewsItem } from "../ingestion-orchestrator";

export interface RssFetcherDeps {
  fetch?: typeof globalThis.fetch;
}

/**
 * Gera um externalId estável para item RSS (usa URL do artigo).
 */
function toExternalId(sourceUrl: string): string {
  try {
    return "rss:" + new URL(sourceUrl).href;
  } catch {
    return "rss:" + sourceUrl;
  }
}

/**
 * Adapter: usa o fetcher RSS existente e converte RawNewsItem → FetchedContentItem.
 * Single Responsibility: apenas adaptar; a lógica de parse está em rss-fetcher.
 */
export function createRssContentFetcher(deps: RssFetcherDeps = {}): IContentFetcher {
  const { fetch: fetchFn } = deps;

  return {
    async fetch(source: ContentSource): Promise<FetchedContentItem[]> {
      if (source.provider !== "rss") {
        throw new Error("RSS fetcher exige provider 'rss'");
      }
      if (!source.rssUrl?.trim()) {
        throw new Error("rssUrl é obrigatório para fonte RSS");
      }

      const sourceInput: SourceInput = {
        id: source.id,
        name: source.name,
        language: source.language,
        rssUrl: source.rssUrl.trim()
      };

      const rawItems: RawNewsItem[] = await fetchRssItemsBySource(sourceInput, {
        ...(fetchFn && { fetch: fetchFn })
      });

      const items: FetchedContentItem[] = rawItems.map((item) => {
        const url = item.sourceUrl ?? "";
        const publishedAt =
          (item as RawNewsItem & { publishedAt?: string }).publishedAt ??
          new Date().toISOString();
        return {
          externalId: toExternalId(url || item.title),
          title: item.title,
          description: item.content ?? "",
          url,
          publishedAt,
          ...(item.imageUrl && { imageUrl: item.imageUrl }),
          contentType: "article" as const
        };
      });

      return items;
    }
  };
}
