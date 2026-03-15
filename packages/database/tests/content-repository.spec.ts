import { describe, expect, it } from "vitest";
import {
  createContentRepository,
  getContentSourceFromConfig
} from "../src/content-repository";

describe("Database Agent - content repository", () => {
  it("deve retornar noticias e jogos com slug unico", async () => {
    const repository = createContentRepository();
    const news = await repository.getNewsArticles();
    const games = await repository.getGames();

    expect(news.length).toBeGreaterThan(0);
    expect(games.length).toBeGreaterThan(0);

    const uniqueNewsSlugs = new Set(news.map((item) => item.slug));
    const uniqueGameSlugs = new Set(games.map((item) => item.slug));

    expect(uniqueNewsSlugs.size).toBe(news.length);
    expect(uniqueGameSlugs.size).toBe(games.length);
  });

  it("deve retornar dados para paginas best e hardware", async () => {
    const repository = createContentRepository();

    expect((await repository.getBestGenres()).length).toBeGreaterThan(0);
    expect((await repository.getBestGenrePlatformPairs()).length).toBeGreaterThan(0);
    expect(await repository.getHardwareProfiles()).toEqual(
      expect.arrayContaining(["8gb", "16gb"])
    );
  });

  it("deve resolver source conforme configuracao", () => {
    expect(getContentSourceFromConfig({ contentSource: "memory" })).toBe("memory");
    expect(getContentSourceFromConfig({ contentSource: "supabase" })).toBe("supabase");
  });

  it("deve persistir itens ingeridos no adapter em memoria (agregador: resumo + sourceUrl)", async () => {
    const repository = createContentRepository();
    const result = await repository.saveIngestedNewsItems([
      {
        sourceId: "s1",
        title: "Nova noticia de teste em portugues",
        content: "Conteudo de teste para validacao de persistencia.",
        sourceUrl: "https://fonte.com/noticia-teste"
      }
    ]);

    expect(result.created).toBeGreaterThanOrEqual(1);
    expect(result.skipped).toBe(0);
    const news = await repository.getNewsArticles();
    expect(news.some((item) => item.title.includes("Nova noticia de teste"))).toBe(true);
    const saved = news.find((item) => item.title.includes("Nova noticia de teste"));
    expect(saved?.summary).toContain("Conteudo de teste");
    expect(saved?.sourceUrl).toBe("https://fonte.com/noticia-teste");
    expect(saved?.contentMd).toBe("");
    expect(saved?.contentHtml).toBe("");
    expect(saved?.canonicalUrl).toContain("/news/");
    expect(saved?.sourceArticleHash.length).toBeGreaterThan(10);
    expect(saved?.aiModel).toBe("ingestion-rss-v1");
    expect(saved?.qualityScore).toBeGreaterThan(0);
  });

  it("deve ignorar item ja existente (mesmo sourceId + sourceUrl) e retornar em skippedItems", async () => {
    const repository = createContentRepository();
    const item = {
      sourceId: "s1",
      title: "Noticia duplicada por URL",
      content: "Conteudo.",
      sourceUrl: "https://fonte.com/ja-existe"
    };
    const first = await repository.saveIngestedNewsItems([item]);
    expect(first.created).toBe(1);
    expect(first.skipped).toBe(0);

    const second = await repository.saveIngestedNewsItems([item]);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);
    expect(second.skippedItems).toHaveLength(1);
    expect(second.skippedItems[0].title).toBe("Noticia duplicada por URL");
    expect(second.skippedItems[0].sourceUrl).toBe("https://fonte.com/ja-existe");
  });

  it("getContentSourcesForIngestion retorna fontes ativas (pt-BR/pt) com provider, rssUrl e channelId", async () => {
    const repository = createContentRepository();
    const sources = await repository.getContentSourcesForIngestion();

    expect(sources.length).toBeGreaterThan(0);
    const rssOnly = sources.filter((s) => s.provider === "rss");
    expect(rssOnly.length).toBe(sources.length);
    sources.forEach((s) => {
      expect(s).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        language: expect.stringMatching(/^pt(-BR)?$/),
        provider: "rss",
        isActive: true
      });
      expect(typeof s.rssUrl === "string" || s.rssUrl === null).toBe(true);
      expect(s.channelId === null || typeof s.channelId === "string").toBe(true);
    });
    const ign = sources.find((s) => s.name.includes("IGN"));
    expect(ign).toBeUndefined();
  });

  it("saveYoutubeVideos retorna shape esperado (memory: no-op)", async () => {
    const repository = createContentRepository();
    const result = await repository.saveYoutubeVideos("s1", [
      {
        videoId: "abc123",
        title: "Video teste",
        description: "Desc",
        url: "https://youtube.com/watch?v=abc123",
        publishedAt: new Date().toISOString(),
        thumbnailUrl: null
      }
    ]);

    expect(result).toMatchObject({
      created: 0,
      skipped: 0,
      skippedItems: []
    });
  });
});
