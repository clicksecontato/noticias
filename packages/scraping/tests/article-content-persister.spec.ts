import { describe, expect, it } from "vitest";
import { createArticleContentPersister } from "../src/persisters/article-content-persister";
import type { ContentSource, FetchedContentItem } from "../src/content-sources/types";

const rssSource: ContentSource = {
  id: "s1",
  name: "Fonte RSS",
  language: "pt-BR",
  provider: "rss",
  rssUrl: "https://a.com/feed",
  isActive: true
};

const items: FetchedContentItem[] = [
  {
    externalId: "rss:https://a.com/1",
    title: "Noticia um",
    description: "Conteudo um",
    url: "https://a.com/1",
    publishedAt: "2026-03-10T12:00:00Z",
    imageUrl: "https://a.com/img1.jpg",
    contentType: "article"
  },
  {
    externalId: "rss:https://a.com/2",
    title: "Noticia dois",
    description: "Conteudo dois",
    url: "https://a.com/2",
    publishedAt: "2026-03-10T13:00:00Z",
    contentType: "article"
  }
];

describe("Article Content Persister", () => {
  it("mapeia itens e chama saveIngestedNewsItems com formato esperado", async () => {
    let captured: Array<{ sourceId: string; title: string; content: string; sourceUrl?: string; imageUrl?: string }> = [];
    const persister = createArticleContentPersister({
      saveIngestedNewsItems: async (input) => {
        captured = input;
        return { created: 2, skipped: 0, skippedItems: [] };
      }
    });

    const result = await persister.persist(rssSource, items);

    expect(captured).toHaveLength(2);
    expect(captured[0]).toEqual({
      sourceId: "s1",
      title: "Noticia um",
      content: "Conteudo um",
      sourceUrl: "https://a.com/1",
      imageUrl: "https://a.com/img1.jpg"
    });
    expect(captured[1].imageUrl).toBeUndefined();
    expect(result).toEqual({ created: 2, skipped: 0, skippedItems: [] });
  });

  it("mapeia skippedItems com sourceUrl para url", async () => {
    const persister = createArticleContentPersister({
      saveIngestedNewsItems: async () => ({
        created: 0,
        skipped: 1,
        skippedItems: [{ sourceId: "s1", title: "Duplicado", sourceUrl: "https://a.com/1" }]
      })
    });

    const result = await persister.persist(rssSource, items);

    expect(result.skippedItems[0]).toEqual({
      sourceId: "s1",
      title: "Duplicado",
      url: "https://a.com/1"
    });
  });
});
