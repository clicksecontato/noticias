export interface SourceInput {
  id: string;
  name: string;
  language: string;
  rssUrl: string;
}

export interface RawNewsItem {
  sourceId: string;
  title: string;
  content: string;
  language: string;
}

export interface IngestionResult {
  processedSourceIds: string[];
  createdArticles: number;
  discardedByLanguage: number;
}

export type FetchNewsBySource = (source: SourceInput) => Promise<RawNewsItem[]>;

export interface ManualIngestionInput {
  availableSources: SourceInput[];
  selectedSourceIds: string[];
  fetchNewsBySource: FetchNewsBySource;
}

export async function runManualNewsIngestion(
  input: ManualIngestionInput
): Promise<IngestionResult> {
  const selectedSet = new Set(input.selectedSourceIds);
  const selectedSources = input.availableSources.filter(
    (source) =>
      selectedSet.has(source.id) && (source.language === "pt-BR" || source.language === "pt")
  );

  let createdArticles = 0;
  let discardedByLanguage = 0;

  for (const source of selectedSources) {
    const items = await input.fetchNewsBySource(source);
    for (const item of items) {
      if (item.language === "pt-BR" || item.language === "pt") {
        createdArticles += 1;
      } else {
        discardedByLanguage += 1;
      }
    }
  }

  return {
    processedSourceIds: selectedSources.map((source) => source.id),
    createdArticles,
    discardedByLanguage
  };
}
