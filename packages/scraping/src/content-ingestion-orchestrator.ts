import type { ContentSource, PersistContentResult } from "./content-sources/types";
import type { IContentFetcher } from "./fetchers/content-fetcher.interface";
import type { IContentPersister } from "./persisters/content-persister.interface";

export interface ContentIngestionResult {
  processedSourceIds: string[];
  resultsBySource: Record<string, PersistContentResult>;
  failedSources: Record<string, string>;
  totalCreated: number;
  totalSkipped: number;
}

export interface RunContentIngestionDeps {
  getFetcher: (provider: ContentSource["provider"]) => IContentFetcher;
  getPersister: (provider: ContentSource["provider"]) => IContentPersister;
}

/**
 * Orquestrador unificado: para cada fonte obtém fetcher e persister pelo provider,
 * busca itens, persiste e agrega resultados. Falhas por fonte são registradas em failedSources.
 */
export async function runContentIngestion(
  sources: ContentSource[],
  deps: RunContentIngestionDeps
): Promise<ContentIngestionResult> {
  const resultsBySource: Record<string, PersistContentResult> = {};
  const failedSources: Record<string, string> = {};
  let totalCreated = 0;
  let totalSkipped = 0;
  const processedSourceIds: string[] = [];

  for (const source of sources) {
    try {
      const fetcher = deps.getFetcher(source.provider);
      const persister = deps.getPersister(source.provider);

      const items = await fetcher.fetch(source);
      const result = await persister.persist(source, items);

      resultsBySource[source.id] = result;
      processedSourceIds.push(source.id);
      totalCreated += result.created;
      totalSkipped += result.skipped;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failedSources[source.id] = message;
    }
  }

  return {
    processedSourceIds,
    resultsBySource,
    failedSources,
    totalCreated,
    totalSkipped
  };
}
