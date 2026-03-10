import type {
  FetchNewsBySource,
  RawNewsItem,
  SourceInput
} from "./ingestion-orchestrator";

function parseTagValues(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, "gis");
  const values: string[] = [];
  let match = regex.exec(xml);

  while (match) {
    values.push(match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());
    match = regex.exec(xml);
  }

  return values;
}

export const fetchRssItemsBySource: FetchNewsBySource = async (
  source: SourceInput
): Promise<RawNewsItem[]> => {
  const response = await fetch(source.rssUrl);
  const xml = await response.text();

  const titles = parseTagValues(xml, "title").slice(0, 6);
  const descriptions = parseTagValues(xml, "description");

  return titles.map((title, index) => ({
    sourceId: source.id,
    title,
    content: descriptions[index] || title,
    language: source.language
  }));
};
