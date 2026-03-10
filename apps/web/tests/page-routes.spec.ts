import { describe, expect, it } from "vitest";
import {
  generateMetadata as generateGameMetadata,
  generateStaticParams as generateGameStaticParams,
  revalidate as gameRevalidate
} from "../app/games/[slug]/page";
import {
  generateMetadata as generateNewsMetadata,
  generateStaticParams as generateNewsStaticParams,
  revalidate as newsRevalidate
} from "../app/news/[slug]/page";
import {
  generateMetadata as generateGamesLikeMetadata,
  generateStaticParams as generateGamesLikeStaticParams,
  revalidate as gamesLikeRevalidate
} from "../app/games-like/[slug]/page";
import {
  generateMetadata as generateBestGenreMetadata,
  generateStaticParams as generateBestGenreStaticParams,
  revalidate as bestGenreRevalidate
} from "../app/best/[genre]/page";
import {
  generateMetadata as generateBestGenrePlatformMetadata,
  generateStaticParams as generateBestGenrePlatformStaticParams,
  revalidate as bestGenrePlatformRevalidate
} from "../app/best/[genre]/[platform]/page";
import {
  generateMetadata as generateHardwareMetadata,
  generateStaticParams as generateHardwareStaticParams,
  revalidate as hardwareRevalidate
} from "../app/hardware/[ram]/page";

describe("Web Application Agent - route modules", () => {
  it("deve expor revalidate por tipo de pagina", () => {
    expect(newsRevalidate).toBe(900);
    expect(gameRevalidate).toBe(86400);
    expect(gamesLikeRevalidate).toBe(86400);
    expect(bestGenreRevalidate).toBe(43200);
    expect(bestGenrePlatformRevalidate).toBe(43200);
    expect(hardwareRevalidate).toBe(43200);
  });

  it("deve expor generateStaticParams para todas as rotas", async () => {
    const newsParams = await generateNewsStaticParams();
    const gameParams = await generateGameStaticParams();
    const gamesLikeParams = await generateGamesLikeStaticParams();
    const bestGenreParams = await generateBestGenreStaticParams();
    const bestGenrePlatformParams = await generateBestGenrePlatformStaticParams();
    const hardwareParams = await generateHardwareStaticParams();

    expect(newsParams.length).toBeGreaterThan(0);
    expect(gameParams.length).toBeGreaterThan(0);
    expect(gamesLikeParams.length).toBeGreaterThan(0);
    expect(bestGenreParams.length).toBeGreaterThan(0);
    expect(bestGenrePlatformParams.length).toBeGreaterThan(0);
    expect(hardwareParams.length).toBeGreaterThan(0);
    expect(newsParams[0]).toHaveProperty("slug");
    expect(gameParams[0]).toHaveProperty("slug");
    expect(gamesLikeParams[0]).toHaveProperty("slug");
    expect(bestGenreParams[0]).toHaveProperty("genre");
    expect(bestGenrePlatformParams[0]).toHaveProperty("genre");
    expect(bestGenrePlatformParams[0]).toHaveProperty("platform");
    expect(hardwareParams[0]).toHaveProperty("ram");
  });

  it("deve gerar metadata com canonical coerente por rota", async () => {
    const news = await generateNewsMetadata({
      params: Promise.resolve({ slug: "novo-trailer-de-gta-6" })
    });
    const game = await generateGameMetadata({
      params: Promise.resolve({ slug: "elden-ring" })
    });
    const gamesLike = await generateGamesLikeMetadata({
      params: Promise.resolve({ slug: "elden-ring" })
    });
    const bestGenre = await generateBestGenreMetadata({
      params: Promise.resolve({ genre: "rpg" })
    });
    const bestGenrePlatform = await generateBestGenrePlatformMetadata({
      params: Promise.resolve({ genre: "rpg", platform: "pc" })
    });
    const hardware = await generateHardwareMetadata({
      params: Promise.resolve({ ram: "8gb" })
    });

    expect(news.alternates.canonical).toContain("/news/novo-trailer-de-gta-6");
    expect(game.alternates.canonical).toContain("/games/elden-ring");
    expect(gamesLike.alternates.canonical).toContain("/games-like/elden-ring");
    expect(bestGenre.alternates.canonical).toContain("/best/rpg");
    expect(bestGenrePlatform.alternates.canonical).toContain("/best/rpg/pc");
    expect(hardware.alternates.canonical).toContain("/hardware/8gb");
  });
});
