import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { getDatabaseConfig, type DatabaseConfig } from "./config";

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
      const { data: linkData } = await readClient
        .from("article_sources")
        .select("article_id,source_id,source_url")
        .in("article_id", articleIds)
        .limit(400);

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

      const fallbackSource = activeSources[0];

      return articles.map((row) => {
        const mappedSourceId = linkByArticleId.get(row.id) || fallbackSource?.id || "unknown";
        const mappedSource = sourceById.get(mappedSourceId);
        const excerptOrTitle = row.excerpt || row.title;
        const bodyForFallback = row.content_md || excerptOrTitle;

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
          ...(row.image_url && { imageUrl: row.image_url })
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
    async saveIngestedNewsItems(items) {
      let created = 0;
      const skippedItems: Array<{ sourceId: string; title: string; sourceUrl?: string }> = [];

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
