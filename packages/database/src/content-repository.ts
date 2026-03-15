import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { getDatabaseConfig, type DatabaseConfig } from "./config";
import { extractEntityIdsFromText } from "./enrichment";
import type {
  ContentSourceRecord,
  YoutubeVideoItem,
  SaveYoutubeVideosResult,
  YoutubeVideoDisplay
} from "./content-source-types";

export interface NewsArticleRecord {
  slug: string;
  title: string;
  summary: string;
  contentMd: string;
  contentHtml: string;
  canonicalUrl: string;
  sourceArticleHash: string;
  aiModel: string;
  qualityScore: number;
  sourceId: string;
  sourceName: string;
  publishedAt: string;
  /** URL do artigo no site de origem (agregador: "Leia no X") */
  sourceUrl: string;
  /** Optional thumbnail/cover image URL (e.g. from RSS). */
  imageUrl?: string;
  /** Nomes de jogos/tags/gêneros/plataformas vinculados (enriquecimento). */
  gameNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  platformNames?: string[];
}

export interface GameRecord {
  slug: string;
  name: string;
  summary: string;
}

export interface GenrePlatformRecord {
  genre: string;
  platform: string;
}

export interface SourceRecord {
  id: string;
  name: string;
  language: "pt-BR" | "pt" | "en-US";
  rssUrl: string;
  isActive: boolean;
}

export interface SaveIngestedResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
}

/** Catálogo para enriquecimento: match de texto com name/slug. */
export interface EnrichmentCatalogItem {
  id: string;
  name: string;
  slug: string;
}

export interface EnrichmentCatalog {
  games: EnrichmentCatalogItem[];
  tags: EnrichmentCatalogItem[];
  genres: EnrichmentCatalogItem[];
  platforms: EnrichmentCatalogItem[];
}

/** IDs encontrados pelo enriquecimento para vincular a artigo ou vídeo. */
export interface EntityIds {
  gameIds: string[];
  tagIds: string[];
  genreIds: string[];
  platformIds: string[];
}

export interface ContentRepository {
  getNewsArticles(): Promise<NewsArticleRecord[]>;
  getGames(): Promise<GameRecord[]>;
  getBestGenres(): Promise<string[]>;
  getBestGenrePlatformPairs(): Promise<GenrePlatformRecord[]>;
  getHardwareProfiles(): Promise<string[]>;
  getActivePortugueseSources(): Promise<SourceRecord[]>;
  saveIngestedNewsItems(
    items: Array<{
      sourceId: string;
      title: string;
      content: string;
      sourceUrl?: string;
      imageUrl?: string;
    }>
  ): Promise<SaveIngestedResult>;
  /** Fontes ativas para ingestão (RSS + YouTube), com flag provider. */
  getContentSourcesForIngestion(): Promise<ContentSourceRecord[]>;
  /** Persiste vídeos do YouTube; dedup por (source_id, video_id). */
  saveYoutubeVideos(
    sourceId: string,
    items: YoutubeVideoItem[]
  ): Promise<SaveYoutubeVideosResult>;
  /** Lista vídeos para a seção Vídeos (ordenado por published_at desc). */
  getYoutubeVideos(options?: {
    limit?: number;
    offset?: number;
    sourceId?: string;
  }): Promise<YoutubeVideoDisplay[]>;
  getYoutubeVideosTotal(sourceId?: string): Promise<number>;
  /** Catálogo (id, name, slug) para enriquecimento de artigos/vídeos. */
  getCatalogsForEnrichment(): Promise<EnrichmentCatalog>;
  /** Vincula um artigo a games, tags, genres, platforms (enriquecimento). */
  linkArticleToEntities(articleId: string, ids: EntityIds): Promise<void>;
  /** Vincula um vídeo YouTube a games, tags, genres, platforms (enriquecimento). */
  linkYoutubeVideoToEntities(youtubeVideoId: string, ids: EntityIds): Promise<void>;
  /** Lista artigos existentes para backfill de enriquecimento (id, título, excerpt). */
  getArticlesForEnrichmentBackfill(): Promise<{ id: string; title: string; excerpt: string }[]>;
  /** Lista vídeos YouTube existentes para backfill de enriquecimento (id, título, description). */
  getYoutubeVideosForEnrichmentBackfill(): Promise<{ id: string; title: string; description: string }[]>;
}

const NEWS_ARTICLES: NewsArticleRecord[] = [
  {
    slug: "novo-trailer-de-gta-6",
    title: "Novo trailer de GTA 6 revela mais da cidade",
    summary: "Confira os principais detalhes revelados e o que muda na jogabilidade.",
    contentMd: "",
    contentHtml: "",
    canonicalUrl: "https://noticias-gaming-platform.local/news/novo-trailer-de-gta-6",
    sourceArticleHash: "seed-hash-gta6",
    aiModel: "seed",
    qualityScore: 0.8,
    sourceId: "s1",
    sourceName: "The Enemy",
    publishedAt: "2026-03-10T12:00:00.000Z",
    sourceUrl: "https://www.theenemy.com.br/exemplo-gta-6"
  },
  {
    slug: "atualizacao-elden-ring",
    title: "Atualizacao de Elden Ring melhora balanceamento",
    summary: "Patch recente ajusta builds e melhora estabilidade em diferentes plataformas.",
    contentMd: "",
    contentHtml: "",
    canonicalUrl: "https://noticias-gaming-platform.local/news/atualizacao-elden-ring",
    sourceArticleHash: "seed-hash-elden-ring",
    aiModel: "seed",
    qualityScore: 0.8,
    sourceId: "s2",
    sourceName: "Canaltech Games",
    publishedAt: "2026-03-09T12:00:00.000Z",
    sourceUrl: "https://canaltech.com.br/exemplo-elden-ring"
  }
];

const GAMES: GameRecord[] = [
  {
    slug: "elden-ring",
    name: "Elden Ring",
    summary: "RPG de acao com exploracao em mundo aberto e combate desafiador."
  },
  {
    slug: "baldurs-gate-3",
    name: "Baldur's Gate 3",
    summary: "RPG tatico com narrativa profunda e escolhas de alto impacto."
  }
];

const BEST_GENRES = ["rpg", "fps", "survival"];

const BEST_GENRE_PLATFORM_PAIRS: GenrePlatformRecord[] = [
  { genre: "rpg", platform: "pc" },
  { genre: "fps", platform: "ps5" },
  { genre: "survival", platform: "xbox-series" }
];

const HARDWARE_PROFILES = ["8gb", "16gb", "32gb"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function toSimpleHtml(content: string): string {
  return `<p>${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIngestedContent(body: string): { contentMd: string; contentHtml: string } {
  const trimmed = body.trim();
  const looksLikeHtml =
    trimmed.startsWith("<") &&
    (trimmed.includes("</p>") || trimmed.includes("<p>") || trimmed.includes("<div"));
  if (looksLikeHtml) {
    return {
      contentMd: htmlToPlainText(body),
      contentHtml: body
    };
  }
  return {
    contentMd: body,
    contentHtml: toSimpleHtml(body)
  };
}

function buildSourceArticleHash(title: string, content: string): string {
  return createHash("sha256").update(`${title}\n${content}`).digest("hex");
}

function computeQualityScore(title: string, content: string): number {
  const titleScore = Math.min(1, title.trim().length / 80);
  const contentScore = Math.min(1, content.trim().length / 1200);
  const score = titleScore * 0.4 + contentScore * 0.6;
  return Number(score.toFixed(3));
}
const SOURCES: SourceRecord[] = [
  {
    id: "s1",
    name: "The Enemy",
    language: "pt-BR",
    rssUrl: "https://www.theenemy.com.br/rss",
    isActive: true
  },
  {
    id: "s2",
    name: "Canaltech Games",
    language: "pt-BR",
    rssUrl: "https://canaltech.com.br/rss/games/",
    isActive: true
  },
  {
    id: "s3",
    name: "IGN International",
    language: "en-US",
    rssUrl: "https://feeds.ign.com/ign/all",
    isActive: false
  }
];

function createMemoryContentRepository(): ContentRepository {
  return {
    async getNewsArticles() {
      return NEWS_ARTICLES;
    },
    async getGames() {
      return GAMES;
    },
    async getBestGenres() {
      return BEST_GENRES;
    },
    async getBestGenrePlatformPairs() {
      return BEST_GENRE_PLATFORM_PAIRS;
    },
    async getHardwareProfiles() {
      return HARDWARE_PROFILES;
    },
    async getActivePortugueseSources() {
      return SOURCES.filter(
        (source) =>
          source.isActive && (source.language === "pt-BR" || source.language === "pt")
      );
    },
    async getContentSourcesForIngestion(): Promise<ContentSourceRecord[]> {
      return SOURCES.filter(
        (s) => s.isActive && (s.language === "pt-BR" || s.language === "pt")
      ).map((s) => ({
        id: s.id,
        name: s.name,
        language: s.language,
        provider: "rss" as const,
        rssUrl: s.rssUrl,
        channelId: null,
        isActive: s.isActive
      }));
    },
    async saveYoutubeVideos(
      _sourceId: string,
      _items: YoutubeVideoItem[]
    ): Promise<SaveYoutubeVideosResult> {
      return { created: 0, skipped: 0, skippedItems: [] };
    },
    async getYoutubeVideos(): Promise<YoutubeVideoDisplay[]> {
      return [];
    },
    async getYoutubeVideosTotal(): Promise<number> {
      return 0;
    },
    async saveIngestedNewsItems(items) {
      let created = 0;
      const skippedItems: Array<{ sourceId: string; title: string; sourceUrl?: string }> = [];
      for (const item of items) {
        const source = SOURCES.find((entry) => entry.id === item.sourceId);
        if (!source) continue;

        const slug = slugify(item.title);
        if (!slug) continue;

        const alreadyExists = NEWS_ARTICLES.some(
          (entry) =>
            entry.sourceId === item.sourceId &&
            (entry.sourceUrl || "") === (item.sourceUrl || "")
        );
        if (alreadyExists) {
          skippedItems.push({
            sourceId: item.sourceId,
            title: item.title,
            sourceUrl: item.sourceUrl
          });
          continue;
        }

        NEWS_ARTICLES.unshift({
          slug,
          title: item.title,
          summary: item.content.slice(0, 240),
          contentMd: "",
          contentHtml: "",
          canonicalUrl: `https://noticias-gaming-platform.local/news/${slug}`,
          sourceArticleHash: buildSourceArticleHash(item.title, item.content),
          aiModel: "ingestion-rss-v1",
          qualityScore: computeQualityScore(item.title, item.content),
          sourceId: source.id,
          sourceName: source.name,
          publishedAt: new Date().toISOString(),
          sourceUrl: item.sourceUrl || "",
          ...(item.imageUrl && { imageUrl: item.imageUrl })
        });
        created += 1;
      }
      return { created, skipped: skippedItems.length, skippedItems };
    },
    async getCatalogsForEnrichment(): Promise<EnrichmentCatalog> {
      return { games: [], tags: [], genres: [], platforms: [] };
    },
    async linkArticleToEntities() {},
    async linkYoutubeVideoToEntities() {},
    async getArticlesForEnrichmentBackfill() {
      return [];
    },
    async getYoutubeVideosForEnrichmentBackfill() {
      return [];
    }
  };
}

function createSupabaseContentRepository(config: DatabaseConfig): ContentRepository {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  }

  const readClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const writeClient = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey || config.supabaseAnonKey
  );

  const fetchActivePortugueseSources = async (): Promise<SourceRecord[]> => {
    const { data, error } = await readClient
      .from("sources")
      .select("id,name,language,rss_url,is_active")
      .eq("is_active", true)
      .in("language", ["pt-BR", "pt"])
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch sources: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      language: row.language,
      rssUrl: row.rss_url,
      isActive: row.is_active
    })) as SourceRecord[];
  };

  const fetchContentSourcesForIngestion = async (): Promise<ContentSourceRecord[]> => {
    const { data, error } = await readClient
      .from("sources")
      .select("id,name,language,provider,rss_url,channel_id,is_active")
      .eq("is_active", true)
      .in("language", ["pt-BR", "pt"])
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch content sources: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      language: row.language,
      provider: (row.provider === "youtube" ? "youtube" : "rss") as ContentSourceRecord["provider"],
      rssUrl: row.rss_url ?? null,
      channelId: row.channel_id ?? null,
      isActive: row.is_active
    }));
  };

  return {
    async getNewsArticles() {
      const { data: articleRows, error: articleReadError } = await readClient
        .from("articles")
        .select(
          "id,slug,title,excerpt,content_md,content_html,canonical_url,source_article_hash,ai_model,quality_score,published_at,image_url"
        )
        .order("published_at", { ascending: false })
        .limit(200);

      if (articleReadError) {
        throw new Error(`Failed to fetch news articles: ${articleReadError.message}`);
      }

      const articles = articleRows || [];
      if (articles.length === 0) {
        return [];
      }

      const articleIds = articles.map((row) => row.id);
      const [linkResult, ag, at, agen, ap] = await Promise.all([
        readClient.from("article_sources").select("article_id,source_id,source_url").in("article_id", articleIds).limit(400),
        readClient.from("article_games").select("article_id, games(name)").in("article_id", articleIds),
        readClient.from("article_tags").select("article_id, tags(name)").in("article_id", articleIds),
        readClient.from("article_genres").select("article_id, genres(name)").in("article_id", articleIds),
        readClient.from("article_platforms").select("article_id, platforms(name)").in("article_id", articleIds)
      ]);

      const linkData = linkResult.data;
      const entityByArticleId = new Map<
        string,
        { gameNames: string[]; tagNames: string[]; genreNames: string[]; platformNames: string[] }
      >();
      const addName = (
        rows: Array<{ article_id: string; games?: { name: string }; tags?: { name: string }; genres?: { name: string }; platforms?: { name: string } }>,
        key: "gameNames" | "tagNames" | "genreNames" | "platformNames",
        subKey: "games" | "tags" | "genres" | "platforms"
      ) => {
        for (const r of rows || []) {
          const name = r[subKey]?.name;
          if (!name) continue;
          let e = entityByArticleId.get(r.article_id);
          if (!e) {
            e = { gameNames: [], tagNames: [], genreNames: [], platformNames: [] };
            entityByArticleId.set(r.article_id, e);
          }
          e[key].push(name);
        }
      };
      addName((ag.data || []) as Array<{ article_id: string; games?: { name: string } }>, "gameNames", "games");
      addName((at.data || []) as Array<{ article_id: string; tags?: { name: string } }>, "tagNames", "tags");
      addName((agen.data || []) as Array<{ article_id: string; genres?: { name: string } }>, "genreNames", "genres");
      addName((ap.data || []) as Array<{ article_id: string; platforms?: { name: string } }>, "platformNames", "platforms");

      const activeSources = await fetchActivePortugueseSources();
      const sourceById = new Map(activeSources.map((source) => [source.id, source]));
      const linkByArticleId = new Map<string, string>();
      const sourceUrlByArticleId = new Map<string, string>();
      for (const link of linkData || []) {
        if (!linkByArticleId.has(link.article_id)) {
          linkByArticleId.set(link.article_id, link.source_id);
          if (link.source_url) sourceUrlByArticleId.set(link.article_id, link.source_url);
        }
      }

      const getEntities = (id: string) => entityByArticleId.get(id) ?? { gameNames: [], tagNames: [], genreNames: [], platformNames: [] };

      const fallbackSource = activeSources[0];

      return articles.map((row) => {
        const mappedSourceId = linkByArticleId.get(row.id) || fallbackSource?.id || "unknown";
        const mappedSource = sourceById.get(mappedSourceId);
        const excerptOrTitle = row.excerpt || row.title;
        const bodyForFallback = row.content_md || excerptOrTitle;

        const entities = getEntities(row.id);
        return {
          slug: row.slug,
          title: row.title,
          summary: excerptOrTitle,
          contentMd: row.content_md || "",
          contentHtml: row.content_html || "",
          canonicalUrl: row.canonical_url || `https://noticias-gaming-platform.local/news/${row.slug}`,
          sourceArticleHash:
            row.source_article_hash || buildSourceArticleHash(row.title, bodyForFallback),
          aiModel: row.ai_model || "ingestion-rss-v1",
          qualityScore:
            typeof row.quality_score === "number"
              ? row.quality_score
              : computeQualityScore(row.title, bodyForFallback),
          sourceId: mappedSourceId,
          sourceName: mappedSource?.name || "Fonte desconhecida",
          publishedAt: row.published_at || new Date().toISOString(),
          sourceUrl: sourceUrlByArticleId.get(row.id) || "",
          ...(row.image_url && { imageUrl: row.image_url }),
          ...(entities.gameNames.length > 0 && { gameNames: entities.gameNames }),
          ...(entities.tagNames.length > 0 && { tagNames: entities.tagNames }),
          ...(entities.genreNames.length > 0 && { genreNames: entities.genreNames }),
          ...(entities.platformNames.length > 0 && { platformNames: entities.platformNames })
        };
      });
    },
    async getGames() {
      const { data: gameData, error: gameError } = await readClient
        .from("games")
        .select("slug,name,summary")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (gameError) {
        throw new Error(`Failed to fetch games: ${gameError.message}`);
      }

      return (gameData || []).map((row) => ({
        slug: row.slug,
        name: row.name,
        summary: row.summary || row.name
      }));
    },
    async getBestGenres() {
      const { data: genreData, error: genreError } = await readClient
        .from("genres")
        .select("slug")
        .limit(100);

      if (genreError) {
        throw new Error(`Failed to fetch genres: ${genreError.message}`);
      }

      return (genreData || []).map((row) => row.slug);
    },
    async getBestGenrePlatformPairs() {
      const [genres, platforms] = await Promise.all([
        this.getBestGenres(),
        (async () => {
          const { data, error } = await readClient.from("platforms").select("slug").limit(10);
          if (error) {
            throw new Error(`Failed to fetch platforms: ${error.message}`);
          }
          return (data || []).map((row) => row.slug);
        })()
      ]);

      const pairs: GenrePlatformRecord[] = [];
      for (const genre of genres.slice(0, 5)) {
        for (const platform of platforms.slice(0, 3)) {
          pairs.push({ genre, platform });
        }
      }

      return pairs;
    },
    async getHardwareProfiles() {
      const { data: seoData, error: seoError } = await readClient
        .from("seo_pages")
        .select("slug_path,page_type")
        .eq("page_type", "hardware")
        .limit(100);

      if (seoError) {
        return HARDWARE_PROFILES;
      }

      const profiles = (seoData || [])
        .map((row) => row.slug_path.split("/").filter(Boolean).at(-1))
        .filter((value): value is string => Boolean(value));

      return profiles.length > 0 ? profiles : HARDWARE_PROFILES;
    },
    async getActivePortugueseSources() {
      return fetchActivePortugueseSources();
    },
    async getContentSourcesForIngestion() {
      return fetchContentSourcesForIngestion();
    },
    async saveYoutubeVideos(
      sourceId: string,
      items: YoutubeVideoItem[]
    ): Promise<SaveYoutubeVideosResult> {
      let created = 0;
      const skippedItems: Array<{ sourceId: string; title: string; url?: string }> = [];
      const catalog = await this.getCatalogsForEnrichment();

      for (const item of items) {
        const { data: existing } = await readClient
          .from("youtube_videos")
          .select("id")
          .eq("source_id", sourceId)
          .eq("video_id", item.videoId)
          .limit(1)
          .maybeSingle();

        if (existing) {
          skippedItems.push({ sourceId, title: item.title, url: item.url });
          continue;
        }

        const { data: inserted, error } = await writeClient
          .from("youtube_videos")
          .insert({
            source_id: sourceId,
            video_id: item.videoId,
            title: item.title,
            description: item.description ?? "",
            published_at: item.publishedAt,
            thumbnail_url: item.thumbnailUrl ?? null,
            url: item.url
          })
          .select("id")
          .single();

        if (error) {
          throw new Error(`Failed to insert youtube video: ${error.message}`);
        }
        if (inserted?.id) {
          const description = item.description ?? "";
          const ids = extractEntityIdsFromText(item.title, description.slice(0, 2000), catalog);
          await this.linkYoutubeVideoToEntities(inserted.id, ids);
        }
        created += 1;
      }

      return { created, skipped: skippedItems.length, skippedItems };
    },
    async getYoutubeVideos(options?: {
      limit?: number;
      offset?: number;
      sourceId?: string;
    }): Promise<YoutubeVideoDisplay[]> {
      const limit = options?.limit ?? 24;
      const offset = options?.offset ?? 0;
      let query = readClient
        .from("youtube_videos")
        .select("id, source_id, video_id, title, description, published_at, thumbnail_url, url")
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (options?.sourceId) {
        query = query.eq("source_id", options.sourceId);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to fetch youtube videos: ${error.message}`);
      }
      const rows = (data || []) as Array<{
        id: string;
        source_id: string;
        video_id: string;
        title: string;
        description: string;
        published_at: string;
        thumbnail_url: string | null;
        url: string;
      }>;
      const videoIds = rows.map((r) => r.id);
      const sourceIds = [...new Set(rows.map((r) => r.source_id))];
      const [sourcesResult, yvg, yvt, yvgen, yvp] = await Promise.all([
        sourceIds.length > 0
          ? readClient.from("sources").select("id, name").in("id", sourceIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
        readClient.from("youtube_video_games").select("youtube_video_id, games(name)").in("youtube_video_id", videoIds),
        readClient.from("youtube_video_tags").select("youtube_video_id, tags(name)").in("youtube_video_id", videoIds),
        readClient.from("youtube_video_genres").select("youtube_video_id, genres(name)").in("youtube_video_id", videoIds),
        readClient.from("youtube_video_platforms").select("youtube_video_id, platforms(name)").in("youtube_video_id", videoIds)
      ]);

      const sourceNames = new Map<string, string>();
      for (const s of sourcesResult.data || []) {
        sourceNames.set(s.id, s.name);
      }

      const videoEntityMap = new Map<
        string,
        { gameNames: string[]; tagNames: string[]; genreNames: string[]; platformNames: string[] }
      >();
      const pushVideoEntity = (
        dataRows: Array<{ youtube_video_id: string; games?: { name: string }; tags?: { name: string }; genres?: { name: string }; platforms?: { name: string } }>,
        sub: "games" | "tags" | "genres" | "platforms",
        key: "gameNames" | "tagNames" | "genreNames" | "platformNames"
      ) => {
        for (const r of dataRows || []) {
          const name = r[sub]?.name;
          if (!name) continue;
          let e = videoEntityMap.get(r.youtube_video_id);
          if (!e) {
            e = { gameNames: [], tagNames: [], genreNames: [], platformNames: [] };
            videoEntityMap.set(r.youtube_video_id, e);
          }
          e[key].push(name);
        }
      };
      pushVideoEntity((yvg.data || []) as Array<{ youtube_video_id: string; games?: { name: string } }>, "games", "gameNames");
      pushVideoEntity((yvt.data || []) as Array<{ youtube_video_id: string; tags?: { name: string } }>, "tags", "tagNames");
      pushVideoEntity((yvgen.data || []) as Array<{ youtube_video_id: string; genres?: { name: string } }>, "genres", "genreNames");
      pushVideoEntity((yvp.data || []) as Array<{ youtube_video_id: string; platforms?: { name: string } }>, "platforms", "platformNames");

      return rows.map((row) => {
        const entities = videoEntityMap.get(row.id) ?? { gameNames: [], tagNames: [], genreNames: [], platformNames: [] };
        return {
          id: row.id,
          sourceId: row.source_id,
          sourceName: sourceNames.get(row.source_id) ?? "YouTube",
          videoId: row.video_id,
          title: row.title,
          description: row.description ?? "",
          publishedAt: row.published_at,
          thumbnailUrl: row.thumbnail_url,
          url: row.url,
          ...(entities.gameNames.length > 0 && { gameNames: entities.gameNames }),
          ...(entities.tagNames.length > 0 && { tagNames: entities.tagNames }),
          ...(entities.genreNames.length > 0 && { genreNames: entities.genreNames }),
          ...(entities.platformNames.length > 0 && { platformNames: entities.platformNames })
        };
      });
    },
    async getYoutubeVideosTotal(sourceId?: string): Promise<number> {
      let query = readClient.from("youtube_videos").select("id", { count: "exact", head: true });
      if (sourceId) {
        query = query.eq("source_id", sourceId);
      }
      const { count, error } = await query;
      if (error) {
        throw new Error(`Failed to count youtube videos: ${error.message}`);
      }
      return count ?? 0;
    },
    async getCatalogsForEnrichment(): Promise<EnrichmentCatalog> {
      const [gamesRes, tagsRes, genresRes, platformsRes] = await Promise.all([
        readClient.from("games").select("id, name, slug").limit(2000),
        readClient.from("tags").select("id, name, slug").limit(2000),
        readClient.from("genres").select("id, name, slug").limit(500),
        readClient.from("platforms").select("id, name, slug").limit(500)
      ]);
      if (gamesRes.error) throw new Error(`Failed to fetch games: ${gamesRes.error.message}`);
      if (tagsRes.error) throw new Error(`Failed to fetch tags: ${tagsRes.error.message}`);
      if (genresRes.error) throw new Error(`Failed to fetch genres: ${genresRes.error.message}`);
      if (platformsRes.error) throw new Error(`Failed to fetch platforms: ${platformsRes.error.message}`);
      return {
        games: (gamesRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" })),
        tags: (tagsRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" })),
        genres: (genresRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" })),
        platforms: (platformsRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" }))
      };
    },
    async linkArticleToEntities(articleId: string, ids: EntityIds): Promise<void> {
      for (const gameId of ids.gameIds) {
        await writeClient.from("article_games").upsert({ article_id: articleId, game_id: gameId }, { onConflict: "article_id,game_id" });
      }
      for (const tagId of ids.tagIds) {
        await writeClient.from("article_tags").upsert({ article_id: articleId, tag_id: tagId }, { onConflict: "article_id,tag_id" });
      }
      for (const genreId of ids.genreIds) {
        await writeClient.from("article_genres").upsert({ article_id: articleId, genre_id: genreId }, { onConflict: "article_id,genre_id" });
      }
      for (const platformId of ids.platformIds) {
        await writeClient.from("article_platforms").upsert({ article_id: articleId, platform_id: platformId }, { onConflict: "article_id,platform_id" });
      }
    },
    async linkYoutubeVideoToEntities(youtubeVideoId: string, ids: EntityIds): Promise<void> {
      for (const gameId of ids.gameIds) {
        await writeClient.from("youtube_video_games").upsert({ youtube_video_id: youtubeVideoId, game_id: gameId }, { onConflict: "youtube_video_id,game_id" });
      }
      for (const tagId of ids.tagIds) {
        await writeClient.from("youtube_video_tags").upsert({ youtube_video_id: youtubeVideoId, tag_id: tagId }, { onConflict: "youtube_video_id,tag_id" });
      }
      for (const genreId of ids.genreIds) {
        await writeClient.from("youtube_video_genres").upsert({ youtube_video_id: youtubeVideoId, genre_id: genreId }, { onConflict: "youtube_video_id,genre_id" });
      }
      for (const platformId of ids.platformIds) {
        await writeClient.from("youtube_video_platforms").upsert({ youtube_video_id: youtubeVideoId, platform_id: platformId }, { onConflict: "youtube_video_id,platform_id" });
      }
    },
    async getArticlesForEnrichmentBackfill(): Promise<{ id: string; title: string; excerpt: string }[]> {
      const { data, error } = await readClient
        .from("articles")
        .select("id, title, excerpt")
        .limit(5000);
      if (error) throw new Error(`Failed to fetch articles for backfill: ${error.message}`);
      return (data || []).map((r) => ({
        id: r.id,
        title: r.title ?? "",
        excerpt: r.excerpt ?? ""
      }));
    },
    async getYoutubeVideosForEnrichmentBackfill(): Promise<{ id: string; title: string; description: string }[]> {
      const { data, error } = await readClient
        .from("youtube_videos")
        .select("id, title, description")
        .limit(5000);
      if (error) throw new Error(`Failed to fetch youtube videos for backfill: ${error.message}`);
      return (data || []).map((r) => ({
        id: r.id,
        title: r.title ?? "",
        description: r.description ?? ""
      }));
    },
    async saveIngestedNewsItems(items) {
      let created = 0;
      const skippedItems: Array<{ sourceId: string; title: string; sourceUrl?: string }> = [];
      const catalog = await this.getCatalogsForEnrichment();

      for (const item of items) {
        const slug = slugify(item.title);
        if (!slug) continue;

        const sourceUrlToStore = item.sourceUrl || null;
        if (sourceUrlToStore) {
          const { data: existing } = await readClient
            .from("article_sources")
            .select("article_id")
            .eq("source_id", item.sourceId)
            .eq("source_url", sourceUrlToStore)
            .limit(1)
            .maybeSingle();

          if (existing) {
            skippedItems.push({
              sourceId: item.sourceId,
              title: item.title,
              sourceUrl: item.sourceUrl
            });
            continue;
          }
        }

        const now = new Date().toISOString();
        const canonicalUrl = `https://noticias-gaming-platform.local/news/${slug}`;
        const sourceArticleHash = buildSourceArticleHash(item.title, item.content);
        const aiModel = "ingestion-rss-v1";
        const qualityScore = computeQualityScore(item.title, item.content);

        const { data: persistedArticle, error: persistedArticleError } = await writeClient
          .from("articles")
          .upsert(
            {
              slug,
              title: item.title,
              excerpt: item.content.slice(0, 240),
              content_md: null,
              content_html: null,
              canonical_url: canonicalUrl,
              source_article_hash: sourceArticleHash,
              ai_model: aiModel,
              quality_score: qualityScore,
              status: "published",
              published_at: now,
              image_url: item.imageUrl ?? null
            },
            { onConflict: "slug" }
          )
          .select("id,slug")
          .single();

        if (persistedArticleError || !persistedArticle) {
          throw new Error(
            `Failed to upsert article: ${persistedArticleError?.message || "unknown"}`
          );
        }

        const { error: sourceLinkError } = await writeClient.from("article_sources").upsert(
          {
            article_id: persistedArticle.id,
            source_id: item.sourceId,
            source_url: sourceUrlToStore || canonicalUrl,
            fetched_at: now
          },
          { onConflict: "article_id,source_id" }
        );

        if (sourceLinkError) {
          throw new Error(`Failed to upsert article source link: ${sourceLinkError.message}`);
        }

        const ids = extractEntityIdsFromText(item.title, item.content.slice(0, 500), catalog);
        await this.linkArticleToEntities(persistedArticle.id, ids);
        created += 1;
      }

      return { created, skipped: skippedItems.length, skippedItems };
    }
  };
}

export function getContentSourceFromConfig(config: Pick<DatabaseConfig, "contentSource">) {
  return config.contentSource === "supabase" ? "supabase" : "memory";
}

export function createContentRepository(): ContentRepository {
  const config = getDatabaseConfig();
  const source = getContentSourceFromConfig(config);

  if (source === "supabase") {
    return createSupabaseContentRepository(config);
  }

  return createMemoryContentRepository();
}
