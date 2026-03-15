import { createContentRepository } from "../../../packages/database/src/content-repository";

export interface HomeCard {
  slug: string;
  title: string;
  summary: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string;
  /** URL do artigo no site de origem (agregador) */
  sourceUrl: string;
  /** Optional thumbnail image URL (e.g. from RSS). */
  imageUrl?: string;
}

export interface NewsSourceFilter {
  id: string;
  name: string;
}

/** Card de vídeo para a seção Vídeos (YouTube). */
export interface YoutubeVideoCard {
  id: string;
  sourceId: string;
  sourceName: string;
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  url: string;
}

/** Artigo para exibição em /news/[slug] (agregador: título + resumo + link para fonte) */
export interface NewsArticleFull {
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string;
  /** URL do artigo no site de origem - "Leia no [fonte]" */
  sourceUrl: string;
  /** Optional cover/thumbnail image URL. */
  imageUrl?: string;
}

export type NewsSortMode = "published_desc" | "published_asc";

export interface RouteContentProvider {
  getNewsSlugs(): Promise<string[]>;
  getGameSlugs(): Promise<string[]>;
  getBestGenres(): Promise<string[]>;
  getBestGenrePlatformPairs(): Promise<Array<{ genre: string; platform: string }>>;
  getHardwareProfiles(): Promise<string[]>;
  getNewsArticleBySlug(slug: string): Promise<NewsArticleFull | null>;
  getNewsMetadataBySlug(
    slug: string
  ): Promise<{ titleBase: string; descriptionBase: string }>;
  getGameMetadataBySlug(
    slug: string
  ): Promise<{ titleBase: string; descriptionBase: string }>;
  getHomeNewsCards(limit?: number): Promise<HomeCard[]>;
  getHomeGameCards(limit?: number): Promise<HomeCard[]>;
  getPaginatedNewsCards(
    page: number,
    pageSize: number,
    sourceId?: string,
    query?: string,
    sort?: NewsSortMode
  ): Promise<HomeCard[]>;
  getNewsCardsTotal(sourceId?: string, query?: string): Promise<number>;
  getMostReadNewsCards(
    limit?: number,
    sourceId?: string,
    query?: string,
    sort?: NewsSortMode
  ): Promise<HomeCard[]>;
  getNewsSourceFilters(): Promise<NewsSourceFilter[]>;
  getPaginatedYoutubeVideos(
    page: number,
    pageSize: number,
    sourceId?: string
  ): Promise<YoutubeVideoCard[]>;
  getYoutubeVideosTotal(sourceId?: string): Promise<number>;
  getYoutubeSourceFilters(): Promise<NewsSourceFilter[]>;
}

function buildFilteredNews(
  news: Awaited<ReturnType<ReturnType<typeof createContentRepository>["getNewsArticles"]>>,
  sourceId?: string,
  query?: string,
  sort: NewsSortMode = "published_desc"
) {
  const loweredQuery = (query || "").trim().toLowerCase();

  const filtered = news.filter((item) => {
    const sourceMatch = sourceId ? item.sourceId === sourceId : true;
    const textMatch = loweredQuery
      ? item.title.toLowerCase().includes(loweredQuery) ||
        item.summary.toLowerCase().includes(loweredQuery)
      : true;
    return sourceMatch && textMatch;
  });

  filtered.sort((left, right) => {
    const leftTime = new Date(left.publishedAt).getTime();
    const rightTime = new Date(right.publishedAt).getTime();
    return sort === "published_asc" ? leftTime - rightTime : rightTime - leftTime;
  });

  return filtered;
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
    async getNewsArticleBySlug(slug: string) {
      const news = await repository.getNewsArticles();
      const article = news.find((item) => item.slug === slug);
      if (!article) return null;
      return {
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        contentHtml: article.contentHtml,
        sourceId: article.sourceId,
        sourceName: article.sourceName,
        publishedAt: article.publishedAt,
        sourceUrl: article.sourceUrl,
        ...(article.imageUrl && { imageUrl: article.imageUrl })
      };
    },
    async getNewsMetadataBySlug(slug: string) {
      const article = await this.getNewsArticleBySlug(slug);
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
    },
    async getHomeNewsCards(limit = 6) {
      const news = await repository.getNewsArticles();
      return news.slice(0, limit).map((item) => ({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        sourceUrl: item.sourceUrl,
        ...(item.imageUrl && { imageUrl: item.imageUrl })
      }));
    },
    async getHomeGameCards(limit = 6) {
      const games = await repository.getGames();
      return games.slice(0, limit).map((item) => ({
        slug: item.slug,
        title: item.name,
        summary: item.summary,
        sourceId: "games-catalog",
        sourceName: "Catalogo de jogos",
        publishedAt: new Date().toISOString(),
        sourceUrl: ""
      }));
    },
    async getPaginatedNewsCards(
      page: number,
      pageSize: number,
      sourceId?: string,
      query?: string,
      sort: NewsSortMode = "published_desc"
    ) {
      const safePage = Math.max(1, page);
      const safePageSize = Math.max(1, pageSize);
      const start = (safePage - 1) * safePageSize;
      const news = await repository.getNewsArticles();
      const filtered = buildFilteredNews(news, sourceId, query, sort);

      return filtered.slice(start, start + safePageSize).map((item) => ({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        sourceUrl: item.sourceUrl,
        ...(item.imageUrl && { imageUrl: item.imageUrl })
      }));
    },
    async getNewsCardsTotal(sourceId?: string, query?: string) {
      const news = await repository.getNewsArticles();
      return buildFilteredNews(news, sourceId, query).length;
    },
    async getMostReadNewsCards(
      limit = 4,
      sourceId?: string,
      query?: string,
      sort: NewsSortMode = "published_desc"
    ) {
      const news = await repository.getNewsArticles();
      const filtered = buildFilteredNews(news, sourceId, query, sort);
      return filtered.slice(0, limit).map((item) => ({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        sourceUrl: item.sourceUrl,
        ...(item.imageUrl && { imageUrl: item.imageUrl })
      }));
    },
    async getNewsSourceFilters() {
      const sources = await repository.getActivePortugueseSources();
      return sources.map((source) => ({
        id: source.id,
        name: source.name
      }));
    },
    async getPaginatedYoutubeVideos(page: number, pageSize: number, sourceId?: string) {
      const safePage = Math.max(1, page);
      const safePageSize = Math.max(1, pageSize);
      const offset = (safePage - 1) * safePageSize;
      const videos = await repository.getYoutubeVideos({
        limit: safePageSize,
        offset,
        sourceId
      });
      return videos.map((v) => ({
        id: v.id,
        sourceId: v.sourceId,
        sourceName: v.sourceName,
        videoId: v.videoId,
        title: v.title,
        description: v.description,
        publishedAt: v.publishedAt,
        thumbnailUrl: v.thumbnailUrl,
        url: v.url
      }));
    },
    async getYoutubeVideosTotal(sourceId?: string) {
      return repository.getYoutubeVideosTotal(sourceId);
    },
    async getYoutubeSourceFilters() {
      const sources = await repository.getContentSourcesForIngestion();
      const youtubeSources = sources.filter((s) => s.provider === "youtube");
      return youtubeSources.map((s) => ({ id: s.id, name: s.name }));
    }
  };
}
