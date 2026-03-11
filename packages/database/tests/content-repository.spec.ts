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
    const created = await repository.saveIngestedNewsItems([
      {
        sourceId: "s1",
        title: "Nova noticia de teste em portugues",
        content: "Conteudo de teste para validacao de persistencia.",
        sourceUrl: "https://fonte.com/noticia-teste"
      }
    ]);

    expect(created).toBeGreaterThanOrEqual(1);
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
});
