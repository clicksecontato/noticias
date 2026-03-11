import { describe, expect, it } from "vitest";
import { createRouteContentProvider } from "../src/content-provider";

describe("Web Application Agent - content provider", () => {
  it("deve prover slugs para rotas dinamicas", async () => {
    const provider = createRouteContentProvider();

    expect((await provider.getNewsSlugs()).length).toBeGreaterThan(0);
    expect((await provider.getGameSlugs()).length).toBeGreaterThan(0);
    expect((await provider.getBestGenres()).length).toBeGreaterThan(0);
    expect((await provider.getBestGenrePlatformPairs()).length).toBeGreaterThan(0);
    expect((await provider.getHardwareProfiles()).length).toBeGreaterThan(0);
  });

  it("deve prover artigo por slug com sourceUrl (agregador)", async () => {
    const provider = createRouteContentProvider();

    const article = await provider.getNewsArticleBySlug("novo-trailer-de-gta-6");
    expect(article).not.toBeNull();
    expect(article!.title.toLowerCase()).toContain("gta");
    expect(article!.summary.length).toBeGreaterThan(20);
    expect(article!.sourceUrl).toBeDefined();
    expect(article!.sourceUrl).toContain("theenemy");
    expect(article!.sourceName).toBeDefined();
    expect(article!.publishedAt).toBeDefined();
  });

  it("deve retornar null para slug de noticia inexistente", async () => {
    const provider = createRouteContentProvider();
    expect(await provider.getNewsArticleBySlug("slug-que-nao-existe")).toBeNull();
  });

  it("deve prover metadata base por slug", async () => {
    const provider = createRouteContentProvider();

    const newsMetadata = await provider.getNewsMetadataBySlug("novo-trailer-de-gta-6");
    const gameMetadata = await provider.getGameMetadataBySlug("elden-ring");

    expect(newsMetadata.titleBase.toLowerCase()).toContain("gta");
    expect(newsMetadata.descriptionBase.length).toBeGreaterThan(20);
    expect(gameMetadata.titleBase.toLowerCase()).toContain("elden");
    expect(gameMetadata.descriptionBase.length).toBeGreaterThan(20);
  });

  it("deve prover cards para home com dados de titulo e resumo", async () => {
    const provider = createRouteContentProvider();
    const newsCards = await provider.getHomeNewsCards(3);
    const gameCards = await provider.getHomeGameCards(3);

    expect(newsCards.length).toBeGreaterThan(0);
    expect(gameCards.length).toBeGreaterThan(0);

    expect(newsCards[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String)
      })
    );

    expect(gameCards[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String)
      })
    );
  });

  it("deve paginar noticias com total consistente", async () => {
    const provider = createRouteContentProvider();

    const total = await provider.getNewsCardsTotal();
    const page1 = await provider.getPaginatedNewsCards(1, 1);
    const page2 = await provider.getPaginatedNewsCards(2, 1);

    expect(total).toBeGreaterThanOrEqual(2);
    expect(page1).toHaveLength(1);
    expect(page2).toHaveLength(1);
    expect(page1[0].slug).not.toBe(page2[0].slug);
  });

  it("deve retornar mais lidas com limite aplicado", async () => {
    const provider = createRouteContentProvider();
    const mostRead = await provider.getMostReadNewsCards(1);

    expect(mostRead).toHaveLength(1);
    expect(mostRead[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String)
      })
    );
  });

  it("deve listar fontes para filtro de noticias", async () => {
    const provider = createRouteContentProvider();
    const sources = await provider.getNewsSourceFilters();

    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String)
      })
    );
  });

  it("deve filtrar noticias por sourceId na paginacao", async () => {
    const provider = createRouteContentProvider();
    const sources = await provider.getNewsSourceFilters();
    const sourceId = sources[0]?.id;

    expect(sourceId).toBeDefined();

    const filtered = await provider.getPaginatedNewsCards(1, 10, sourceId);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((item) => item.sourceId === sourceId)).toBe(true);
  });

  it("deve buscar noticias por termo no titulo ou resumo", async () => {
    const provider = createRouteContentProvider();
    const results = await provider.getPaginatedNewsCards(1, 10, undefined, "gta");

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some(
        (item) =>
          item.title.toLowerCase().includes("gta") || item.summary.toLowerCase().includes("gta")
      )
    ).toBe(true);
  });

  it("deve ordenar noticias por data asc e desc", async () => {
    const provider = createRouteContentProvider();
    const desc = await provider.getPaginatedNewsCards(1, 10, undefined, "", "published_desc");
    const asc = await provider.getPaginatedNewsCards(1, 10, undefined, "", "published_asc");

    expect(desc.length).toBeGreaterThan(1);
    expect(asc.length).toBeGreaterThan(1);

    const descFirst = new Date(desc[0].publishedAt).getTime();
    const descSecond = new Date(desc[1].publishedAt).getTime();
    const ascFirst = new Date(asc[0].publishedAt).getTime();
    const ascSecond = new Date(asc[1].publishedAt).getTime();

    expect(descFirst).toBeGreaterThanOrEqual(descSecond);
    expect(ascFirst).toBeLessThanOrEqual(ascSecond);
  });
});
