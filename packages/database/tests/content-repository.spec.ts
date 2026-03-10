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
});
