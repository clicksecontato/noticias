import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { getDatabaseConfig, type DatabaseConfig } from "./config";
import { extractEntityIdsFromText } from "./enrichment";
import { extractEntitiesWithGemini, isEnrichmentAiEnabled } from "./enrichment-ai";
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
  /** Nomes de assuntos/tags/tipos vinculados (enriquecimento). */
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
}

export interface SubjectRecord {
  slug: string;
  name: string;
  summary: string;
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
  subjects: EnrichmentCatalogItem[];
  tags: EnrichmentCatalogItem[];
  types: EnrichmentCatalogItem[];
}

/** IDs encontrados pelo enriquecimento para vincular a artigo ou vídeo. */
export interface EntityIds {
  subjectIds: string[];
  tagIds: string[];
  typeIds: string[];
}

/** Nomes sugeridos por IA para resolver ou criar (enriquecimento com IA). */
export interface SuggestedEntities {
  subjects: string[];
  tags: string[];
  types: string[];
}

export interface ContentRepository {
  getNewsArticles(): Promise<NewsArticleRecord[]>;
  getSubjects(): Promise<SubjectRecord[]>;
  getBestTypes(): Promise<string[]>;
  getActivePortugueseSources(): Promise<SourceRecord[]>;
  saveIngestedNewsItems(
    items: Array<{
      sourceId: string;
      title: string;
      content: string;
      sourceUrl?: string;
      imageUrl?: string;
      publishedAt?: string;
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
  /** Vincula um artigo a subjects, tags, types (enriquecimento). */
  linkArticleToEntities(articleId: string, ids: EntityIds): Promise<void>;
  /** Vincula um vídeo YouTube a subjects, tags, types (enriquecimento). */
  linkYoutubeVideoToEntities(youtubeVideoId: string, ids: EntityIds): Promise<void>;
  /** Lista artigos existentes para backfill de enriquecimento (id, título, excerpt). */
  getArticlesForEnrichmentBackfill(): Promise<{ id: string; title: string; excerpt: string }[]>;
  /** Lista vídeos YouTube existentes para backfill de enriquecimento (id, título, description). */
  getYoutubeVideosForEnrichmentBackfill(): Promise<{ id: string; title: string; description: string }[]>;
  /** Resolve IDs existentes ou cria entidades a partir de nomes sugeridos (ex.: pela IA). */
  resolveOrCreateEntityIds(suggested: SuggestedEntities): Promise<EntityIds>;
}

const NEWS_ARTICLES: NewsArticleRecord[] = [
  {
    slug: "openai-lanca-atualizacao-chatgpt",
    title: "OpenAI lanca atualizacao do ChatGPT com novos recursos",
    summary: "Confira o que muda na experiencia e nos limites da API.",
    contentMd: "",
    contentHtml: "",
    canonicalUrl: "https://noticias-platform.local/news/openai-lanca-atualizacao-chatgpt",
    sourceArticleHash: "seed-hash-chatgpt",
    aiModel: "seed",
    qualityScore: 0.8,
    sourceId: "s1",
    sourceName: "Tecnoblog",
    publishedAt: "2026-09-20T12:00:00.000Z",
    sourceUrl: "https://tecnoblog.net/exemplo-chatgpt"
  },
  {
    slug: "anthropic-atualiza-claude",
    title: "Anthropic atualiza Claude com foco em agentes",
    summary: "Nova versao melhora raciocinio e uso de ferramentas em fluxos longos.",
    contentMd: "",
    contentHtml: "",
    canonicalUrl: "https://noticias-platform.local/news/anthropic-atualiza-claude",
    sourceArticleHash: "seed-hash-claude",
    aiModel: "seed",
    qualityScore: 0.8,
    sourceId: "s2",
    sourceName: "Canaltech IA",
    publishedAt: "2026-09-19T12:00:00.000Z",
    sourceUrl: "https://canaltech.com.br/exemplo-claude"
  }
];

const SUBJECTS: SubjectRecord[] = [
  {
    slug: "chatgpt",
    name: "ChatGPT",
    summary: "Assistente conversacional da OpenAI."
  },
  {
    slug: "claude",
    name: "Claude",
    summary: "Familia de modelos de IA da Anthropic."
  }
];

const BEST_TYPES = ["llm", "agentes", "regulacao"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/** Último segmento útil da URL (estável por matéria), para slug quando o título colide. */
function slugFromSourceUrl(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    let last = segments[segments.length - 1] || "";
    last = last.replace(/\.(htm|html|php|aspx|xml|json)$/i, "");
    if (!last || /^index$/i.test(last)) {
      last = segments.length > 1 ? segments[segments.length - 2] || "" : last;
    }
    const s = slugify(last.replace(/_/g, "-"));
    if (s.length > 100) return s.slice(0, 100).replace(/-+$/g, "");
    return s;
  } catch {
    return "";
  }
}

function shortSlugSuffix(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex").slice(0, 8);
}

function allocateArticleSlugMemory(
  item: { title: string; sourceUrl?: string },
  existingSlugs: Set<string>
): string | null {
  const fromTitle = slugify(item.title);
  const fromUrl = item.sourceUrl ? slugFromSourceUrl(item.sourceUrl) : "";
  const base =
    fromUrl.length >= 4 ? fromUrl : fromTitle.length > 0 ? fromTitle : "";
  if (!base) return null;
  const salt = (item.sourceUrl && item.sourceUrl.trim()) || item.title;
  let candidate = base;
  for (let attempt = 0; attempt < 12; attempt++) {
    if (!existingSlugs.has(candidate)) return candidate;
    const suffix = shortSlugSuffix(`${salt}:${attempt}`);
    candidate = `${base}-${suffix}`;
    if (candidate.length > 200) {
      candidate = `${fromTitle.slice(0, 24)}-${suffix}`;
    }
  }
  return null;
}

async function allocateArticleSlugSupabase(
  readClient: ReturnType<typeof createClient>,
  title: string,
  sourceUrl: string | null | undefined
): Promise<string | null> {
  const fromTitle = slugify(title);
  const fromUrl = sourceUrl ? slugFromSourceUrl(sourceUrl) : "";
  const base =
    fromUrl.length >= 4 ? fromUrl : fromTitle.length > 0 ? fromTitle : "";
  if (!base) return null;
  const salt = (sourceUrl && sourceUrl.trim()) || title;
  let candidate = base;
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await readClient
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Slug lookup failed: ${error.message}`);
    }
    if (!data) return candidate;
    const suffix = shortSlugSuffix(`${salt}:${attempt}`);
    candidate = `${base}-${suffix}`;
    if (candidate.length > 200) {
      candidate = `${fromTitle.slice(0, 24)}-${suffix}`;
    }
  }
  return null;
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
    name: "Tecnoblog",
    language: "pt-BR",
    rssUrl: "https://tecnoblog.net/feed/",
    isActive: true
  },
  {
    id: "s2",
    name: "Canaltech IA",
    language: "pt-BR",
    rssUrl: "https://canaltech.com.br/rss/inteligencia-artificial/",
    isActive: true
  },
  {
    id: "s3",
    name: "OpenAI News",
    language: "en-US",
    rssUrl: "https://openai.com/news/rss.xml",
    isActive: false
  }
];

function createMemoryContentRepository(): ContentRepository {
  return {
    async getNewsArticles() {
      return NEWS_ARTICLES;
    },
    async getSubjects() {
      return SUBJECTS;
    },
    async getBestTypes() {
      return BEST_TYPES;
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
      const slugSet = new Set(NEWS_ARTICLES.map((a) => a.slug));
      for (const item of items) {
        const source = SOURCES.find((entry) => entry.id === item.sourceId);
        if (!source) continue;

        const slug = allocateArticleSlugMemory(item, slugSet);
        if (!slug) continue;
        slugSet.add(slug);

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

        const publishedAtStored =
          item.publishedAt && Number.isFinite(Date.parse(item.publishedAt))
            ? new Date(item.publishedAt).toISOString()
            : new Date().toISOString();

        NEWS_ARTICLES.unshift({
          slug,
          title: item.title,
          summary: item.content.slice(0, 240),
          contentMd: "",
          contentHtml: "",
          canonicalUrl: `https://noticias-platform.local/news/${slug}`,
          sourceArticleHash: buildSourceArticleHash(item.title, item.content),
          aiModel: "ingestion-rss-v1",
          qualityScore: computeQualityScore(item.title, item.content),
          sourceId: source.id,
          sourceName: source.name,
          publishedAt: publishedAtStored,
          sourceUrl: item.sourceUrl || "",
          ...(item.imageUrl && { imageUrl: item.imageUrl })
        });
        created += 1;
      }
      return { created, skipped: skippedItems.length, skippedItems };
    },
    async getCatalogsForEnrichment(): Promise<EnrichmentCatalog> {
      return { subjects: [], tags: [], types: [] };
    },
    async linkArticleToEntities() {},
    async linkYoutubeVideoToEntities() {},
    async getArticlesForEnrichmentBackfill() {
      return [];
    },
    async getYoutubeVideosForEnrichmentBackfill() {
      return [];
    },
    async resolveOrCreateEntityIds(): Promise<EntityIds> {
      return { subjectIds: [], tagIds: [], typeIds: [] };
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
        .eq("is_news", true)
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
      const [linkResult, asub, at, atype] = await Promise.all([
        readClient.from("article_sources").select("article_id,source_id,source_url").in("article_id", articleIds).limit(400),
        readClient.from("article_subjects").select("article_id, subjects(name)").in("article_id", articleIds),
        readClient.from("article_tags").select("article_id, tags(name)").in("article_id", articleIds),
        readClient.from("article_types").select("article_id, types(name)").in("article_id", articleIds)
      ]);

      const linkData = linkResult.data;
      const entityByArticleId = new Map<
        string,
        { subjectNames: string[]; tagNames: string[]; typeNames: string[] }
      >();
      const addName = (
        rows: Array<{ article_id: string; subjects?: { name: string }; tags?: { name: string }; types?: { name: string } }>,
        key: "subjectNames" | "tagNames" | "typeNames",
        subKey: "subjects" | "tags" | "types"
      ) => {
        for (const r of rows || []) {
          const name = r[subKey]?.name;
          if (!name) continue;
          let e = entityByArticleId.get(r.article_id);
          if (!e) {
            e = { subjectNames: [], tagNames: [], typeNames: [] };
            entityByArticleId.set(r.article_id, e);
          }
          e[key].push(name);
        }
      };
      addName((asub.data || []) as unknown as Array<{ article_id: string; subjects?: { name: string } }>, "subjectNames", "subjects");
      addName((at.data || []) as unknown as Array<{ article_id: string; tags?: { name: string } }>, "tagNames", "tags");
      addName((atype.data || []) as unknown as Array<{ article_id: string; types?: { name: string } }>, "typeNames", "types");

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

      const getEntities = (id: string) => entityByArticleId.get(id) ?? { subjectNames: [], tagNames: [], typeNames: [] };

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
          canonicalUrl: row.canonical_url || `https://noticias-platform.local/news/${row.slug}`,
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
          ...(entities.subjectNames.length > 0 && { subjectNames: entities.subjectNames }),
          ...(entities.tagNames.length > 0 && { tagNames: entities.tagNames }),
          ...(entities.typeNames.length > 0 && { typeNames: entities.typeNames })
        };
      });
    },
    async getSubjects() {
      const { data: subjectData, error: subjectError } = await readClient
        .from("subjects")
        .select("slug,name,summary")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (subjectError) {
        throw new Error(`Failed to fetch subjects: ${subjectError.message}`);
      }

      return (subjectData || []).map((row) => ({
        slug: row.slug,
        name: row.name,
        summary: row.summary || row.name
      }));
    },
    async getBestTypes() {
      const { data: typeData, error: typeError } = await readClient
        .from("types")
        .select("slug")
        .limit(100);

      if (typeError) {
        throw new Error(`Failed to fetch types: ${typeError.message}`);
      }

      return (typeData || []).map((row) => row.slug);
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
            url: item.url,
            is_news: true
          })
          .select("id")
          .single();

        if (error) {
          throw new Error(`Failed to insert youtube video: ${error.message}`);
        }
        if (inserted?.id) {
          const description = item.description ?? "";
          let ids: EntityIds;
          if (isEnrichmentAiEnabled()) {
            try {
              const suggested = await extractEntitiesWithGemini(item.title, description.slice(0, 2000));
              ids = await this.resolveOrCreateEntityIds(suggested);
              const fromText = extractEntityIdsFromText(item.title, description.slice(0, 2000), catalog);
              ids = {
                subjectIds: [...new Set([...ids.subjectIds, ...fromText.subjectIds])],
                tagIds: [...new Set([...ids.tagIds, ...fromText.tagIds])],
                typeIds: [...new Set([...ids.typeIds, ...fromText.typeIds])]
              };
            } catch (e) {
              console.warn("[enrichment] AI enrichment failed for video, using text match:", (e as Error).message);
              ids = extractEntityIdsFromText(item.title, description.slice(0, 2000), catalog);
            }
          } else {
            ids = extractEntityIdsFromText(item.title, description.slice(0, 2000), catalog);
          }
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
        .eq("is_news", true)
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
      const [sourcesResult, yvs, yvt, yvtype] = await Promise.all([
        sourceIds.length > 0
          ? readClient.from("sources").select("id, name").in("id", sourceIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
        readClient.from("youtube_video_subjects").select("youtube_video_id, subjects(name)").in("youtube_video_id", videoIds),
        readClient.from("youtube_video_tags").select("youtube_video_id, tags(name)").in("youtube_video_id", videoIds),
        readClient.from("youtube_video_types").select("youtube_video_id, types(name)").in("youtube_video_id", videoIds)
      ]);

      const sourceNames = new Map<string, string>();
      for (const s of sourcesResult.data || []) {
        sourceNames.set(s.id, s.name);
      }

      const videoEntityMap = new Map<
        string,
        { subjectNames: string[]; tagNames: string[]; typeNames: string[] }
      >();
      const pushVideoEntity = (
        dataRows: Array<{ youtube_video_id: string; subjects?: { name: string }; tags?: { name: string }; types?: { name: string } }>,
        sub: "subjects" | "tags" | "types",
        key: "subjectNames" | "tagNames" | "typeNames"
      ) => {
        for (const r of dataRows || []) {
          const name = r[sub]?.name;
          if (!name) continue;
          let e = videoEntityMap.get(r.youtube_video_id);
          if (!e) {
            e = { subjectNames: [], tagNames: [], typeNames: [] };
            videoEntityMap.set(r.youtube_video_id, e);
          }
          e[key].push(name);
        }
      };
      pushVideoEntity((yvs.data || []) as unknown as Array<{ youtube_video_id: string; subjects?: { name: string } }>, "subjects", "subjectNames");
      pushVideoEntity((yvt.data || []) as unknown as Array<{ youtube_video_id: string; tags?: { name: string } }>, "tags", "tagNames");
      pushVideoEntity((yvtype.data || []) as unknown as Array<{ youtube_video_id: string; types?: { name: string } }>, "types", "typeNames");

      return rows.map((row) => {
        const entities = videoEntityMap.get(row.id) ?? { subjectNames: [], tagNames: [], typeNames: [] };
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
          ...(entities.subjectNames.length > 0 && { subjectNames: entities.subjectNames }),
          ...(entities.tagNames.length > 0 && { tagNames: entities.tagNames }),
          ...(entities.typeNames.length > 0 && { typeNames: entities.typeNames })
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
      const [subjectsRes, tagsRes, typesRes] = await Promise.all([
        readClient.from("subjects").select("id, name, slug").limit(2000),
        readClient.from("tags").select("id, name, slug").limit(2000),
        readClient.from("types").select("id, name, slug").limit(500)
      ]);
      if (subjectsRes.error) throw new Error(`Failed to fetch subjects: ${subjectsRes.error.message}`);
      if (tagsRes.error) throw new Error(`Failed to fetch tags: ${tagsRes.error.message}`);
      if (typesRes.error) throw new Error(`Failed to fetch types: ${typesRes.error.message}`);
      return {
        subjects: (subjectsRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" })),
        tags: (tagsRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" })),
        types: (typesRes.data || []).map((r) => ({ id: r.id, name: r.name ?? "", slug: r.slug ?? "" }))
      };
    },
    async resolveOrCreateEntityIds(suggested: SuggestedEntities): Promise<EntityIds> {
      const slugToId = async (
        table: "subjects" | "tags" | "types",
        names: string[]
      ): Promise<string[]> => {
        const bySlug = new Map<string, string>();
        for (const name of names) {
          const s = slugify(name.trim());
          if (!s || bySlug.has(s)) continue;
          bySlug.set(s, name.trim());
        }
        const ids: string[] = [];
        for (const [sl, name] of bySlug) {
          const { data: existing } = await readClient.from(table).select("id").eq("slug", sl).limit(1).maybeSingle();
          if (existing?.id) {
            ids.push(existing.id);
            continue;
          }
          if (table === "subjects") {
            const { data: inserted, error } = await writeClient
              .from("subjects")
              .insert({ slug: sl, name, summary: null, release_date: null, rating: null, status: "published" })
              .select("id")
              .single();
            if (!error && inserted?.id) ids.push(inserted.id);
          } else if (table === "tags") {
            const { data: inserted, error } = await writeClient.from("tags").insert({ slug: sl, name }).select("id").single();
            if (!error && inserted?.id) ids.push(inserted.id);
          } else {
            const { data: inserted, error } = await writeClient.from("types").insert({ slug: sl, name, description: null }).select("id").single();
            if (!error && inserted?.id) ids.push(inserted.id);
          }
        }
        return ids;
      };
      const [subjectIds, tagIds, typeIds] = await Promise.all([
        slugToId("subjects", suggested.subjects),
        slugToId("tags", suggested.tags),
        slugToId("types", suggested.types)
      ]);
      return { subjectIds, tagIds, typeIds };
    },
    async linkArticleToEntities(articleId: string, ids: EntityIds): Promise<void> {
      for (const subjectId of ids.subjectIds) {
        await writeClient.from("article_subjects").upsert({ article_id: articleId, subject_id: subjectId }, { onConflict: "article_id,subject_id" });
      }
      for (const tagId of ids.tagIds) {
        await writeClient.from("article_tags").upsert({ article_id: articleId, tag_id: tagId }, { onConflict: "article_id,tag_id" });
      }
      for (const typeId of ids.typeIds) {
        await writeClient.from("article_types").upsert({ article_id: articleId, type_id: typeId }, { onConflict: "article_id,type_id" });
      }
    },
    async linkYoutubeVideoToEntities(youtubeVideoId: string, ids: EntityIds): Promise<void> {
      for (const subjectId of ids.subjectIds) {
        await writeClient.from("youtube_video_subjects").upsert({ youtube_video_id: youtubeVideoId, subject_id: subjectId }, { onConflict: "youtube_video_id,subject_id" });
      }
      for (const tagId of ids.tagIds) {
        await writeClient.from("youtube_video_tags").upsert({ youtube_video_id: youtubeVideoId, tag_id: tagId }, { onConflict: "youtube_video_id,tag_id" });
      }
      for (const typeId of ids.typeIds) {
        await writeClient.from("youtube_video_types").upsert({ youtube_video_id: youtubeVideoId, type_id: typeId }, { onConflict: "youtube_video_id,type_id" });
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
        const slug = await allocateArticleSlugSupabase(readClient, item.title, item.sourceUrl);
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
        const publishedAtToStore =
          item.publishedAt && Number.isFinite(Date.parse(item.publishedAt))
            ? new Date(item.publishedAt).toISOString()
            : now;
        const canonicalUrl = `https://noticias-platform.local/news/${slug}`;
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
              published_at: publishedAtToStore,
              image_url: item.imageUrl ?? null,
              is_news: true
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

        let ids: EntityIds;
        if (isEnrichmentAiEnabled()) {
          try {
            const suggested = await extractEntitiesWithGemini(item.title, item.content.slice(0, 500));
            ids = await this.resolveOrCreateEntityIds(suggested);
            const fromText = extractEntityIdsFromText(item.title, item.content.slice(0, 500), catalog);
            ids = {
                subjectIds: [...new Set([...ids.subjectIds, ...fromText.subjectIds])],
                tagIds: [...new Set([...ids.tagIds, ...fromText.tagIds])],
                typeIds: [...new Set([...ids.typeIds, ...fromText.typeIds])]
              };
          } catch (e) {
            console.warn("[enrichment] AI enrichment failed, using text match:", (e as Error).message);
            ids = extractEntityIdsFromText(item.title, item.content.slice(0, 500), catalog);
          }
        } else {
          ids = extractEntityIdsFromText(item.title, item.content.slice(0, 500), catalog);
        }
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
