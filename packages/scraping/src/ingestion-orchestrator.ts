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
  sourceUrl?: string;
}

export interface SkippedArticle {
  sourceId: string;
  title: string;
  sourceUrl?: string;
}

export interface PersistNewsResult {
  created: number;
  skipped: number;
  skippedItems: SkippedArticle[];
}

export interface IngestionResult {
  processedSourceIds: string[];
  createdArticles: number;
  discardedByLanguage: number;
  discardedByValidation: number;
  createdBySource: Record<string, number>;
  skippedBySource: Record<string, number>;
  skippedArticles: SkippedArticle[];
}

export type FetchNewsBySource = (source: SourceInput) => Promise<RawNewsItem[]>;

export interface ManualIngestionInput {
  availableSources: SourceInput[];
  selectedSourceIds: string[];
  fetchNewsBySource: FetchNewsBySource;
  persistNewsItems?: (items: RawNewsItem[]) => Promise<PersistNewsResult>;
}

function isInvalidNewsItem(item: RawNewsItem): boolean {
  const text = `${item.title} ${item.content}`.toLowerCase();
  if (text.includes("404") || text.includes("not found") || text.includes("nao encontrado")) {
    return true;
  }
  if (item.title.trim().length < 8) {
    return true;
  }
  if (item.content.trim().length < 10) {
    return true;
  }
  return false;
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
  let discardedByValidation = 0;
  const createdBySource: Record<string, number> = {};
  const skippedBySource: Record<string, number> = {};
  const skippedArticles: SkippedArticle[] = [];

  for (const source of selectedSources) {
    const items = await input.fetchNewsBySource(source);
    const acceptedItems: RawNewsItem[] = [];
    for (const item of items) {
      if (item.language === "pt-BR" || item.language === "pt") {
        if (isInvalidNewsItem(item)) {
          discardedByValidation += 1;
        } else {
          acceptedItems.push(item);
        }
      } else {
        discardedByLanguage += 1;
      }
    }

    if (input.persistNewsItems) {
      const result = await input.persistNewsItems(acceptedItems);
      createdArticles += result.created;
      createdBySource[source.id] = result.created;
      skippedBySource[source.id] = result.skipped;
      skippedArticles.push(...result.skippedItems);
    } else {
      createdArticles += acceptedItems.length;
      createdBySource[source.id] = acceptedItems.length;
      skippedBySource[source.id] = 0;
    }
  }

  return {
    processedSourceIds: selectedSources.map((source) => source.id),
    createdArticles,
    discardedByLanguage,
    discardedByValidation,
    createdBySource,
    skippedBySource,
    skippedArticles
  };
}
