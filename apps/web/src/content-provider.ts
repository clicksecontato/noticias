import { createContentRepository } from "../../../packages/database/src/content-repository";

export interface RouteContentProvider {
  getNewsSlugs(): Promise<string[]>;
  getGameSlugs(): Promise<string[]>;
  getBestGenres(): Promise<string[]>;
  getBestGenrePlatformPairs(): Promise<Array<{ genre: string; platform: string }>>;
  getHardwareProfiles(): Promise<string[]>;
  getNewsMetadataBySlug(
    slug: string
  ): Promise<{ titleBase: string; descriptionBase: string }>;
  getGameMetadataBySlug(
    slug: string
  ): Promise<{ titleBase: string; descriptionBase: string }>;
}

export function createRouteContentProvider(): RouteContentProvider {
  const repository = createContentRepository();

  return {
    async getNewsSlugs() {
      const news = await repository.getNewsArticles();
      return news.map((item) => item.slug);
    },
    async getGameSlugs() {
      const games = await repository.getGames();
      return games.map((item) => item.slug);
    },
    async getBestGenres() {
      return repository.getBestGenres();
    },
    async getBestGenrePlatformPairs() {
      return repository.getBestGenrePlatformPairs();
    },
    async getHardwareProfiles() {
      return repository.getHardwareProfiles();
    },
    async getNewsMetadataBySlug(slug: string) {
      const news = await repository.getNewsArticles();
      const article = news.find((item) => item.slug === slug);
      if (!article) {
        throw new Error(`News content not found for slug: ${slug}`);
      }
      return {
        titleBase: article.title,
        descriptionBase: article.summary
      };
    },
    async getGameMetadataBySlug(slug: string) {
      const games = await repository.getGames();
      const game = games.find((item) => item.slug === slug);
      if (!game) {
        throw new Error(`Game content not found for slug: ${slug}`);
      }
      return {
        titleBase: game.name,
        descriptionBase: game.summary
      };
    }
  };
}
