import {
  createContentRepository,
  type SourceRecord
} from "../../../packages/database/src/content-repository";
import { runManualNewsIngestion } from "../../../packages/scraping/src/ingestion-orchestrator";
import { fetchRssItemsBySource } from "../../../packages/scraping/src/rss-fetcher";

function mapSourceRecord(source: SourceRecord) {
  return {
    id: source.id,
    name: source.name,
    language: source.language,
    rssUrl: source.rssUrl
  };
}

export async function executeManualNewsIngestion(selectedSourceIds: string[]) {
  const repository = createContentRepository();
  const sources = await repository.getActivePortugueseSources();

  return runManualNewsIngestion({
    availableSources: sources.map(mapSourceRecord),
    selectedSourceIds,
    fetchNewsBySource: fetchRssItemsBySource
  });
}
