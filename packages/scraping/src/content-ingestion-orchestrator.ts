import type { ContentSource, PersistContentResult } from "./content-sources/types";
import type { IContentFetcher } from "./fetchers/content-fetcher.interface";
import type { IContentPersister } from "./persisters/content-persister.interface";

export interface ContentIngestionResult {
  processedSourceIds: string[];
  resultsBySource: Record<string, PersistContentResult>;
  failedSources: Record<string, string>;
  /** Duração wall-clock por fonte (sucesso ou falha), em ms. */
  durationMsBySource: Record<string, number>;
  totalCreated: number;
  totalSkipped: number;
}

export interface RunContentIngestionDeps {
  getFetcher: (provider: ContentSource["provider"]) => IContentFetcher;
  getPersister: (provider: ContentSource["provider"]) => IContentPersister;
  /** Relógio injetável para testes; default Date.now. */
  nowMs?: () => number;
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
  const durationMsBySource: Record<string, number> = {};
  let totalCreated = 0;
  let totalSkipped = 0;
  const processedSourceIds: string[] = [];
  const nowMs = deps.nowMs ?? (() => Date.now());

  for (const source of sources) {
    const startedAt = nowMs();
    try {
      const fetcher = deps.getFetcher(source.provider);
      const persister = deps.getPersister(source.provider);

      const outcome = await fetcher.fetch(source);
      const result = await persister.persist(source, outcome.items);
      const durationMs = Math.max(0, nowMs() - startedAt);

      const fetchStats = { ...outcome.stats, durationMs };
      resultsBySource[source.id] = {
        ...result,
        fetchStats
      };
      durationMsBySource[source.id] = durationMs;
      processedSourceIds.push(source.id);
      totalCreated += result.created;
      totalSkipped += result.skipped;

      if (typeof process !== "undefined" && !process.env.VITEST) {
        console.log(
          JSON.stringify({
            event: "ingestion.source.complete",
            sourceId: source.id,
            provider: source.provider,
            durationMs,
            fetch: fetchStats,
            persist: { created: result.created, skipped: result.skipped }
          })
        );
      }
    } catch (err) {
      const durationMs = Math.max(0, nowMs() - startedAt);
      durationMsBySource[source.id] = durationMs;
      const message = err instanceof Error ? err.message : String(err);
      failedSources[source.id] = message;
      if (typeof process !== "undefined" && !process.env.VITEST) {
        console.log(
          JSON.stringify({
            event: "ingestion.source.failed",
            sourceId: source.id,
            provider: source.provider,
            durationMs,
            error: message
          })
        );
      }
    }
  }

  return {
    processedSourceIds,
    resultsBySource,
    failedSources,
    durationMsBySource,
    totalCreated,
    totalSkipped
  };
}
