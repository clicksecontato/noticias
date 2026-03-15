import { createContentRepository } from "../../../packages/database/src/content-repository";
import { runContentIngestion } from "../../../packages/scraping/src/content-ingestion-orchestrator";
import { createContentFetcher } from "../../../packages/scraping/src/fetchers/content-fetcher-factory";
import { createContentPersister } from "../../../packages/scraping/src/persisters/content-persister-factory";
import type { ContentSource } from "../../../packages/scraping/src/content-sources/types";
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

  const createdBySource: Record<string, number> = {};
  const skippedBySource: Record<string, number> = {};
  const skippedArticles: Array<{ sourceId: string; title: string; sourceUrl?: string }> = [];
  let createdArticles = 0;
  let createdVideos = 0;

  for (const sourceId of result.processedSourceIds) {
    const r = result.resultsBySource[sourceId];
    if (!r) continue;
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

  return {
    processedSourceIds: result.processedSourceIds,
    createdArticles,
    createdVideos,
    discardedByLanguage: 0,
    discardedByValidation: 0,
    createdBySource,
    skippedBySource,
    skippedArticles,
    ...(Object.keys(result.failedSources).length > 0 && {
      failedSources: result.failedSources
    })
  };
}
