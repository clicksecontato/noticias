import { afterEach, describe, expect, it, vi } from "vitest";
import { createRssContentFetcher } from "../src/fetchers/rss-content-fetcher";
import type { ContentSource } from "../src/content-sources/types";

function createRssSource(overrides: Partial<ContentSource> = {}): ContentSource {
  return {
    id: "s1",
    name: "Fonte RSS",
    language: "pt-BR",
    provider: "rss",
    rssUrl: "https://example.com/feed.xml",
    isActive: true,
    ...overrides
  };
}

const rssXml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Noticia de teste</title>
    <description>Resumo do artigo para o hub.</description>
    <link>https://example.com/noticia-1</link>
  </item>
  <item>
    <title>Outra noticia</title>
    <description>Outro resumo.</description>
    <link>https://example.com/noticia-2</link>
  </item>
</channel></rss>`;

describe("RSS Content Fetcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve rejeitar fonte que não é rss", async () => {
    const fetcher = createRssContentFetcher();
    const source = createRssSource({ provider: "youtube" as "rss" });

    await expect(fetcher.fetch(source)).rejects.toThrow(/provider 'rss'|rss exige/i);
  });

  it("deve rejeitar fonte sem rssUrl", async () => {
    const fetcher = createRssContentFetcher();
    const source = createRssSource({ rssUrl: undefined });

    await expect(fetcher.fetch(source)).rejects.toThrow(/rssUrl|obrigatório/i);
  });

  it("deve buscar feed e mapear para FetchedContentItem com contentType article", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(rssXml, { status: 200 }));
    const fetcher = createRssContentFetcher({ fetch: mockFetch });
    const source = createRssSource();

    const items = await fetcher.fetch(source);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "Noticia de teste",
      description: "Resumo do artigo para o hub.",
      url: "https://example.com/noticia-1",
      contentType: "article"
    });
    expect(items[0].externalId).toBeTruthy();
    expect(items[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(items[1].title).toBe("Outra noticia");
    expect(items[1].contentType).toBe("article");
  });

  it("deve retornar array vazio quando o feed não tem itens válidos", async () => {
    const emptyXml = `<?xml version="1.0"?><rss><channel></channel></rss>`;
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(emptyXml, { status: 200 }));
    const fetcher = createRssContentFetcher({ fetch: mockFetch });
    const source = createRssSource();

    const items = await fetcher.fetch(source);

    expect(items).toEqual([]);
  });

  it("deve lançar quando o fetch do feed falha", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response("", { status: 404 }));
    const fetcher = createRssContentFetcher({ fetch: mockFetch });
    const source = createRssSource();

    await expect(fetcher.fetch(source)).rejects.toThrow(/404|failed|rss/i);
  });
});
