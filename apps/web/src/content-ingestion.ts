import { createContentRepository } from "../../../packages/database/src/content-repository";
import { runContentIngestion } from "../../../packages/scraping/src/content-ingestion-orchestrator";
import { createContentFetcher } from "../../../packages/scraping/src/fetchers/content-fetcher-factory";
import { createContentPersister } from "../../../packages/scraping/src/persisters/content-persister-factory";
import type { ContentSource } from "../../../packages/scraping/src/content-sources/types";
import type { IngestionFetchStats } from "../../../packages/scraping/src/content-sources/types";
import type { AdminIngestResponseBody } from "./api/admin-ingest-handler";

function mapToContentSource(
  record: Awaited<ReturnType<ReturnType<typeof createContentRepository>["getContentSourcesForIngestion"]>>[number]
): ContentSource {
  return {
    id: record.id,
    name: record.name,
    language: record.language,
    provider: record.provider,
    rssUrl: record.rssUrl ?? undefined,
    channelId: record.channelId ?? undefined,
    isActive: record.isActive
  };
}

/**
 * Ingestão unificada: usa runContentIngestion para RSS e YouTube.
 * Retorna formato esperado pela API admin (AdminIngestResponseBody).
 */
export async function executeContentIngestion(
  selectedSourceIds: string[]
): Promise<AdminIngestResponseBody> {
  const repository = createContentRepository();
  const allSources = await repository.getContentSourcesForIngestion();
  const selectedSet = new Set(selectedSourceIds);
  const sources = allSources
    .filter((s) => selectedSet.has(s.id))
    .map(mapToContentSource);

  const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? "";

  const getFetcher = (provider: ContentSource["provider"]) =>
    createContentFetcher(provider, {
      rss: {},
      youtube: { apiKey: youtubeApiKey }
    });

  const getPersister = (provider: ContentSource["provider"]) =>
    createContentPersister(provider, {
      article: {
        saveIngestedNewsItems: (items) =>
          repository.saveIngestedNewsItems(
            items.map((item) => ({
              sourceId: item.sourceId,
              title: item.title,
              content: item.content,
              sourceUrl: item.sourceUrl,
              ...(item.publishedAt && { publishedAt: item.publishedAt }),
              ...(item.imageUrl && { imageUrl: item.imageUrl })
            }))
          )
      },
      youtube: {
        saveYoutubeVideos: (sourceId, items) =>
          repository.saveYoutubeVideos(sourceId, items)
      }
    });

  const result = await runContentIngestion(sources, {
    getFetcher,
    getPersister
  });

  const finishedAt = new Date().toISOString();
  await Promise.all(
    Object.entries(result.durationMsBySource).map(([sourceId, durationMs]) =>
      repository.updateSourceIngestionTiming(sourceId, {
        lastIngestedAt: finishedAt,
        durationMs
      })
    )
  );

  const createdBySource: Record<string, number> = {};
  const skippedBySource: Record<string, number> = {};
  const fetchStatsBySource: Record<string, IngestionFetchStats> = {};
  const skippedArticles: Array<{ sourceId: string; title: string; sourceUrl?: string }> = [];
  let createdArticles = 0;
  let createdVideos = 0;

  for (const sourceId of result.processedSourceIds) {
    const r = result.resultsBySource[sourceId];
    if (!r) continue;
    if (r.fetchStats) {
      fetchStatsBySource[sourceId] = r.fetchStats;
    } else if (result.durationMsBySource[sourceId] != null) {
      const source = sources.find((s) => s.id === sourceId);
      fetchStatsBySource[sourceId] = {
        provider: source?.provider ?? "rss",
        durationMs: result.durationMsBySource[sourceId]
      };
    }
    const source = sources.find((s) => s.id === sourceId);
    if (source?.provider === "youtube") {
      createdVideos += r.created;
    } else {
      createdArticles += r.created;
    }
    createdBySource[sourceId] = r.created;
    skippedBySource[sourceId] = r.skipped;
    skippedArticles.push(
      ...r.skippedItems.map((s) => ({
        sourceId: s.sourceId,
        title: s.title,
        sourceUrl: s.url
      }))
    );
  }

  // Inclui duração de fontes que falharam (para a UI de ingestão).
  for (const [sourceId, durationMs] of Object.entries(result.durationMsBySource)) {
    if (fetchStatsBySource[sourceId]) continue;
    const source = sources.find((s) => s.id === sourceId);
    fetchStatsBySource[sourceId] = {
      provider: source?.provider ?? "rss",
      durationMs
    };
  }

  return {
    processedSourceIds: result.processedSourceIds,
    createdArticles,
    createdVideos,
    discardedByLanguage: 0,
    discardedByValidation: 0,
    createdBySource,
    skippedBySource,
    skippedArticles,
    ...(Object.keys(fetchStatsBySource).length > 0 && { fetchStatsBySource }),
    ...(Object.keys(result.failedSources).length > 0 && {
      failedSources: result.failedSources
    })
  };
}
