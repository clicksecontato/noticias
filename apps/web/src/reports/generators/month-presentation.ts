import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../../packages/database/src/config";

const IN_FILTER_BATCH_SIZE = 100;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 300;
type SupabaseResponseShape = { data?: unknown; error?: { message?: string } | null; count?: number | null };

interface SourceRow {
  id: string;
  name: string;
  provider: "rss" | "youtube" | null;
}

interface ContentWithSource {
  id: string;
  published_at: string;
  source_id: string;
  provider: "rss" | "youtube";
}

/** Filtros opcionais para visões parciais da apresentação mensal (preview ou relatório salvo). */
export interface MonthPresentationFilters {
  provider?: "all" | "rss" | "youtube";
  /** Se definido e não vazio, restringe às fontes indicadas. */
  sourceIds?: string[];
}

export function applyMonthPresentationFilters(
  rows: ContentWithSource[],
  filters?: MonthPresentationFilters
): ContentWithSource[] {
  if (!filters) return rows;
  let out = rows;
  const p = filters.provider ?? "all";
  if (p !== "all") {
    out = out.filter((r) => r.provider === p);
  }
  const sids = filters.sourceIds;
  if (sids && sids.length > 0) {
    const allow = new Set(sids);
    out = out.filter((r) => allow.has(r.source_id));
  }
  return out;
}

/** Mesma ordem usada em `cadence` (Dom=0 … Sáb=6, UTC). */
const WEEKDAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export interface MonthPresentationPayload {
  summary: {
    period_start: string;
    period_end: string;
    sources_total: number;
    sources_rss: number;
    sources_youtube: number;
    contents_total: number;
    articles_total: number;
    videos_total: number;
    links_total: number;
    links_per_content: number;
  };
  source_mix: Array<{ tipo: "RSS" | "YouTube"; fontes: number; conteudos: number; share: number }>;
  monthly_evolution: Array<{ mes: string; conteudos: number; vinculos: number }>;
  link_quality: Array<{
    tipo: "Notícia RSS" | "Vídeo YouTube";
    assuntos: number;
    tags: number;
    tipos: number;
  }>;
  top_clusters: Array<{ cluster: string; citacoes: number }>;
  cadence: Array<{ dia: string; rss: number; youtube: number }>;
  /** Ritmo editorial: total de publicações por dia da semana (UTC) no período, por fonte (top N por volume). */
  cadence_by_source: Array<{
    source_id: string;
    source_name: string;
    provider: "rss" | "youtube";
    total: number;
    dias: Array<{ dia: string; conteudos: number }>;
  }>;
  /**
   * Todos os itens do período (is_news true ou false): relevância para o hub (games) vs genérico.
   * Alinhado à coluna `is_news` em articles / youtube_videos.
   */
  news_relevance?: MonthPresentationNewsRelevance;
  script: Array<{ title: string; text: string }>;
}

export interface MonthPresentationNewsRelevance {
  articles: {
    total: number;
    /** is_news === true */
    subjects_context: number;
    /** is_news === false */
    generic: number;
    pct_subjects: number;
  };
  videos: {
    total: number;
    subjects_context: number;
    generic: number;
    pct_subjects: number;
  };
  combined: {
    total: number;
    subjects_context: number;
    generic: number;
    pct_subjects: number;
  };
  by_source: Array<{
    source_id: string;
    source_name: string;
    provider: "rss" | "youtube";
    total: number;
    subjects_context: number;
    generic: number;
    pct_subjects: number;
  }>;
}

function createSupabaseClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado para month-presentation");
  return createClient(url, key);
}

function toStartIso(date: string): string {
  return date.length === 10 ? `${date}T00:00:00.000Z` : date;
}

function toEndExclusiveIso(date: string): string {
  if (date.length !== 10) return date;
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function formatMonthLabel(dateYmd: string): string {
  const [y, m] = dateYmd.split("-");
  const monthIdx = Number(m) - 1;
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[Math.max(0, Math.min(11, monthIdx))]}/${y.slice(2)}`;
}

const TOP_SOURCES_FOR_SOURCE_CADENCE = 15;

function computeCadenceBySourceWeekday(
  contentRows: ContentWithSource[],
  sourcesById: Map<string, SourceRow>
): Array<{
  source_id: string;
  source_name: string;
  provider: "rss" | "youtube";
  total: number;
  dias: Array<{ dia: string; conteudos: number }>;
}> {
  const bySource = new Map<string, Map<number, number>>();
  const totals = new Map<string, number>();

  for (const row of contentRows) {
    const sid = row.source_id;
    const dow = new Date(row.published_at).getUTCDay();
    if (!bySource.has(sid)) bySource.set(sid, new Map());
    const dm = bySource.get(sid)!;
    dm.set(dow, (dm.get(dow) ?? 0) + 1);
    totals.set(sid, (totals.get(sid) ?? 0) + 1);
  }

  const sortedIds = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, TOP_SOURCES_FOR_SOURCE_CADENCE);

  return sortedIds.map((sourceId) => {
    const meta = sourcesById.get(sourceId);
    const name = meta?.name?.trim() || sourceId;
    const provider: "rss" | "youtube" = meta?.provider === "youtube" ? "youtube" : "rss";
    const dm = bySource.get(sourceId) ?? new Map();
    const dias = WEEKDAY_LABELS_PT.map((label, day) => ({
      dia: label,
      conteudos: dm.get(day) ?? 0,
    }));
    return {
      source_id: sourceId,
      source_name: name,
      provider,
      total: totals.get(sourceId) ?? 0,
      dias,
    };
  });
}

function isRetryableFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return message.includes("fetch failed") || message.includes("network") || message.includes("timeout");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(operation: () => Promise<T>, attempts = RETRY_ATTEMPTS): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (i === attempts || !isRetryableFetchError(err)) throw err;
      await wait(RETRY_BASE_MS * i);
    }
  }
  throw lastError;
}

async function queryWithRetry<T extends SupabaseResponseShape>(operation: () => Promise<T>): Promise<T> {
  return withRetry(operation);
}

async function fetchArticleRows(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<Array<{ id: string; published_at: string }>> {
  const start = toStartIso(periodStart);
  const endExclusive = toEndExclusiveIso(periodEnd);
  const { data, error } = await client
    .from("articles")
    .select("id,published_at")
    .eq("is_news", true)
    .gte("published_at", start)
    .lt("published_at", endExclusive);
  if (error) throw new Error(`Falha ao carregar artigos: ${error.message}`);
  return (data ?? []) as Array<{ id: string; published_at: string }>;
}

async function fetchVideoRows(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<Array<{ id: string; published_at: string; source_id: string }>> {
  const start = toStartIso(periodStart);
  const endExclusive = toEndExclusiveIso(periodEnd);
  const { data, error } = await client
    .from("youtube_videos")
    .select("id,published_at,source_id")
    .eq("is_news", true)
    .gte("published_at", start)
    .lt("published_at", endExclusive);
  if (error) throw new Error(`Falha ao carregar vídeos: ${error.message}`);
  return (data ?? []) as Array<{ id: string; published_at: string; source_id: string }>;
}

/** Artigos no período com flag is_news (inclui genéricos). */
async function fetchAllArticleRowsWithNews(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<Array<{ id: string; published_at: string; is_news: boolean }>> {
  const start = toStartIso(periodStart);
  const endExclusive = toEndExclusiveIso(periodEnd);
  const { data, error } = await client
    .from("articles")
    .select("id,published_at,is_news")
    .gte("published_at", start)
    .lt("published_at", endExclusive);
  if (error) throw new Error(`Falha ao carregar artigos (relevância): ${error.message}`);
  return (data ?? []) as Array<{ id: string; published_at: string; is_news: boolean }>;
}

/** Vídeos no período com flag is_news (inclui não-notícia). */
async function fetchAllVideoRowsWithNews(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<Array<{ id: string; published_at: string; source_id: string; is_news: boolean }>> {
  const start = toStartIso(periodStart);
  const endExclusive = toEndExclusiveIso(periodEnd);
  const { data, error } = await client
    .from("youtube_videos")
    .select("id,published_at,source_id,is_news")
    .gte("published_at", start)
    .lt("published_at", endExclusive);
  if (error) throw new Error(`Falha ao carregar vídeos (relevância): ${error.message}`);
  return (data ?? []) as Array<{
    id: string;
    published_at: string;
    source_id: string;
    is_news: boolean;
  }>;
}

interface ContentRowWithNews {
  id: string;
  published_at: string;
  source_id: string | null;
  provider: "rss" | "youtube";
  is_news: boolean;
}

const TOP_SOURCES_NEWS_RELEVANCE = 50;

function applyRelevanceRowFilters(
  rows: ContentRowWithNews[],
  filters?: MonthPresentationFilters
): ContentRowWithNews[] {
  if (!filters) return rows;
  let out = rows;
  const p = filters.provider ?? "all";
  if (p !== "all") {
    out = out.filter((r) => r.provider === p);
  }
  const sids = filters.sourceIds;
  if (sids && sids.length > 0) {
    const allow = new Set(sids);
    out = out.filter((r) => r.source_id != null && allow.has(r.source_id));
  }
  return out;
}

function pctPart(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

/** Agregação pura para testes e reuso; `sourcesById` resolve nome/provedor das fontes. */
export function buildNewsRelevancePayload(
  rows: ContentRowWithNews[],
  sourcesById: Map<string, SourceRow>
): MonthPresentationNewsRelevance {
  const articles = rows.filter((r) => r.provider === "rss");
  const videos = rows.filter((r) => r.provider === "youtube");

  const sum3 = (list: ContentRowWithNews[]) => {
    const total = list.length;
    const subjects = list.filter((r) => r.is_news).length;
    const generic = total - subjects;
    return { total, subjects_context: subjects, generic, pct_subjects: pctPart(subjects, total) };
  };

  const a = sum3(articles);
  const v = sum3(videos);
  const c = sum3(rows);

  const bySource = new Map<
    string,
    { total: number; subjects: number; provider: "rss" | "youtube" }
  >();

  for (const r of rows) {
    if (!r.source_id) continue;
    if (!bySource.has(r.source_id)) {
      bySource.set(r.source_id, { total: 0, subjects: 0, provider: r.provider });
    }
    const cur = bySource.get(r.source_id)!;
    cur.total += 1;
    if (r.is_news) cur.subjects += 1;
  }

  const by_source = Array.from(bySource.entries())
    .map(([source_id, agg]) => {
      const meta = sourcesById.get(source_id);
      const name = meta?.name?.trim() || source_id;
      const provider: "rss" | "youtube" = meta?.provider === "youtube" ? "youtube" : agg.provider;
      return {
        source_id,
        source_name: name,
        provider,
        total: agg.total,
        subjects_context: agg.subjects,
        generic: agg.total - agg.subjects,
        pct_subjects: pctPart(agg.subjects, agg.total),
      };
    })
    .sort((x, y) => y.total - x.total)
    .slice(0, TOP_SOURCES_NEWS_RELEVANCE);

  const unmappedArticles = articles.filter((r) => r.source_id == null).length;
  if (unmappedArticles > 0) {
    const subjects = articles.filter((r) => r.source_id == null && r.is_news).length;
    by_source.push({
      source_id: "__unmapped_articles__",
      source_name: "Artigos RSS sem fonte vinculada",
      provider: "rss",
      total: unmappedArticles,
      subjects_context: subjects,
      generic: unmappedArticles - subjects,
      pct_subjects: pctPart(subjects, unmappedArticles),
    });
  }

  return {
    articles: {
      total: a.total,
      subjects_context: a.subjects_context,
      generic: a.generic,
      pct_subjects: a.pct_subjects,
    },
    videos: {
      total: v.total,
      subjects_context: v.subjects_context,
      generic: v.generic,
      pct_subjects: v.pct_subjects,
    },
    combined: {
      total: c.total,
      subjects_context: c.subjects_context,
      generic: c.generic,
      pct_subjects: c.pct_subjects,
    },
    by_source,
  };
}

async function buildRelevanceRowsForPeriod(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<{
  rows: ContentRowWithNews[];
  sourcesById: Map<string, SourceRow>;
}> {
  const articles = await fetchAllArticleRowsWithNews(client, periodStart, periodEnd);
  const videos = await fetchAllVideoRowsWithNews(client, periodStart, periodEnd);
  const articleIds = articles.map((a) => a.id);
  const articleSourceMap = await mapArticleSources(client, articleIds);
  const sourceIdsSet = new Set<string>([
    ...Array.from(articleSourceMap.values()),
    ...videos.map((v) => v.source_id),
  ]);
  const sourcesById = await getSourcesMap(client, Array.from(sourceIdsSet));

  const rows: ContentRowWithNews[] = [
    ...articles.map((a) => {
      const sourceId = articleSourceMap.get(a.id) ?? null;
      const provider: "rss" = "rss";
      return {
        id: a.id,
        published_at: a.published_at,
        source_id: sourceId,
        provider,
        is_news: a.is_news === true,
      };
    }),
    ...videos.map((v) => ({
      id: v.id,
      published_at: v.published_at,
      source_id: v.source_id,
      provider: "youtube" as const,
      is_news: v.is_news === true,
    })),
  ];

  return { rows, sourcesById };
}

async function mapArticleSources(
  client: ReturnType<typeof createSupabaseClient>,
  articleIds: string[]
): Promise<Map<string, string>> {
  if (!articleIds.length) return new Map();
  const map = new Map<string, string>();
  const batchSize = IN_FILTER_BATCH_SIZE;
  for (let i = 0; i < articleIds.length; i += batchSize) {
    const batch = articleIds.slice(i, i + batchSize);
    const { data, error } = await queryWithRetry(async () =>
      await client
        .from("article_sources")
        .select("article_id,source_id")
        .in("article_id", batch)
    );
    if (error) throw new Error(`Falha ao carregar article_sources: ${error.message}`);
    for (const row of data ?? []) {
      if (!map.has(row.article_id)) map.set(row.article_id, row.source_id);
    }
  }
  return map;
}

async function getSourcesMap(
  client: ReturnType<typeof createSupabaseClient>,
  sourceIds: string[]
): Promise<Map<string, SourceRow>> {
  if (!sourceIds.length) return new Map();
  const map = new Map<string, SourceRow>();
  const batchSize = IN_FILTER_BATCH_SIZE;
  for (let i = 0; i < sourceIds.length; i += batchSize) {
    const batch = sourceIds.slice(i, i + batchSize);
    const { data, error } = await queryWithRetry(async () =>
      await client
        .from("sources")
        .select("id,name,provider")
        .in("id", batch)
    );
    if (error) throw new Error(`Falha ao carregar sources: ${error.message}`);
    for (const row of data ?? []) {
      map.set(row.id, row as SourceRow);
    }
  }
  return map;
}

async function countRowsByIds(
  client: ReturnType<typeof createSupabaseClient>,
  table: string,
  idColumn: string,
  ids: string[]
): Promise<number> {
  if (!ids.length) return 0;
  let total = 0;
  const batchSize = IN_FILTER_BATCH_SIZE;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { count, error } = await queryWithRetry(async () =>
      await client
        .from(table)
        .select(idColumn, { count: "exact", head: true })
        .in(idColumn, batch)
    );
    if (error) throw new Error(`Falha ao contar ${table}: ${error.message}`);
    total += count ?? 0;
  }
  return total;
}

async function getTopTagClusters(
  client: ReturnType<typeof createSupabaseClient>,
  articleIds: string[],
  videoIds: string[]
): Promise<Array<{ cluster: string; citacoes: number }>> {
  const counts = new Map<string, number>();
  const addCount = (tagId: string) => counts.set(tagId, (counts.get(tagId) ?? 0) + 1);

  const batchSize = IN_FILTER_BATCH_SIZE;
  for (let i = 0; i < articleIds.length; i += batchSize) {
    const batch = articleIds.slice(i, i + batchSize);
    const { data, error } = await queryWithRetry(async () =>
      await client
        .from("article_tags")
        .select("tag_id")
        .in("article_id", batch)
    );
    if (error) throw new Error(`Falha ao carregar article_tags: ${error.message}`);
    for (const row of data ?? []) addCount(row.tag_id);
  }
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const { data, error } = await queryWithRetry(async () =>
      await client
        .from("youtube_video_tags")
        .select("tag_id")
        .in("youtube_video_id", batch)
    );
    if (error) throw new Error(`Falha ao carregar youtube_video_tags: ${error.message}`);
    for (const row of data ?? []) addCount(row.tag_id);
  }

  const tagIds = Array.from(counts.keys());
  if (!tagIds.length) return [];
  const { data: tagsRows, error: tagsError } = await client
    .from("tags")
    .select("id,name")
    .in("id", tagIds);
  if (tagsError) throw new Error(`Falha ao carregar tags: ${tagsError.message}`);
  const tagNameById = new Map((tagsRows ?? []).map((r) => [r.id, r.name ?? r.id]));

  return tagIds
    .map((tagId) => ({
      cluster: tagNameById.get(tagId) ?? tagId,
      citacoes: counts.get(tagId) ?? 0,
    }))
    .sort((a, b) => b.citacoes - a.citacoes)
    .slice(0, 5);
}

async function buildContentRowsForPeriod(
  client: ReturnType<typeof createSupabaseClient>,
  periodStart: string,
  periodEnd: string
): Promise<{
  articles: Array<{ id: string; published_at: string }>;
  videos: Array<{ id: string; published_at: string; source_id: string }>;
  contentRows: ContentWithSource[];
}> {
  const articles = await fetchArticleRows(client, periodStart, periodEnd);
  const videos = await fetchVideoRows(client, periodStart, periodEnd);
  const articleIds = articles.map((a) => a.id);
  const articleSourceMap = await mapArticleSources(client, articleIds);
  const sourceIdsSet = new Set<string>([
    ...Array.from(articleSourceMap.values()),
    ...videos.map((v) => v.source_id),
  ]);
  const sourcesById = await getSourcesMap(client, Array.from(sourceIdsSet));
  const contentRows: ContentWithSource[] = [
    ...articles
      .map((a) => {
        const sourceId = articleSourceMap.get(a.id);
        if (!sourceId) return null;
        const source = sourcesById.get(sourceId);
        const provider = source?.provider === "youtube" ? "youtube" : "rss";
        return {
          id: a.id,
          published_at: a.published_at,
          source_id: sourceId,
          provider,
        } as ContentWithSource;
      })
      .filter((v): v is ContentWithSource => !!v),
    ...videos.map((v) => ({
      id: v.id,
      published_at: v.published_at,
      source_id: v.source_id,
      provider: "youtube" as const,
    })),
  ];
  return { articles, videos, contentRows };
}

async function getFilteredWindowMetrics(
  client: ReturnType<typeof createSupabaseClient>,
  startYmd: string,
  endYmd: string,
  filters?: MonthPresentationFilters
): Promise<{ contents: number; links: number }> {
  const { contentRows: full } = await buildContentRowsForPeriod(client, startYmd, endYmd);
  const rows = applyMonthPresentationFilters(full, filters);
  const articleIds = rows.filter((r) => r.provider === "rss").map((r) => r.id);
  const videoIds = rows.filter((r) => r.provider === "youtube").map((r) => r.id);
  const [ag, at, agen, vg, vt, vgen] = await Promise.all([
    countRowsByIds(client, "article_subjects", "article_id", articleIds),
    countRowsByIds(client, "article_tags", "article_id", articleIds),
    countRowsByIds(client, "article_types", "article_id", articleIds),
    countRowsByIds(client, "youtube_video_subjects", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_tags", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_types", "youtube_video_id", videoIds),
  ]);
  return {
    contents: rows.length,
    links: ag + at + agen + vg + vt + vgen,
  };
}

export async function generateMonthPresentationReport(
  periodStart: string,
  periodEnd: string,
  filters?: MonthPresentationFilters
): Promise<MonthPresentationPayload> {
  const client = createSupabaseClient();

  const [{ contentRows: fullContentRows }, { rows: fullRelRows, sourcesById: relSourcesById }] =
    await Promise.all([
      buildContentRowsForPeriod(client, periodStart, periodEnd),
      buildRelevanceRowsForPeriod(client, periodStart, periodEnd),
    ]);
  const contentRows = applyMonthPresentationFilters(fullContentRows, filters);
  const relFiltered = applyRelevanceRowFilters(fullRelRows, filters);
  const news_relevance = buildNewsRelevancePayload(relFiltered, relSourcesById);

  const filteredArticleIds = contentRows.filter((c) => c.provider === "rss").map((c) => c.id);
  const filteredVideoIds = contentRows.filter((c) => c.provider === "youtube").map((c) => c.id);

  const sourceIdsInView = new Set(contentRows.map((c) => c.source_id));
  const sourcesById = await getSourcesMap(client, Array.from(sourceIdsInView));

  const rssSourceIds = new Set(contentRows.filter((c) => c.provider === "rss").map((c) => c.source_id));
  const ytSourceIds = new Set(contentRows.filter((c) => c.provider === "youtube").map((c) => c.source_id));
  const rssContents = contentRows.filter((c) => c.provider === "rss").length;
  const ytContents = contentRows.filter((c) => c.provider === "youtube").length;
  const contentsTotal = rssContents + ytContents;

  const [ag, at, agen, vg, vt, vgen] = await Promise.all([
    countRowsByIds(client, "article_subjects", "article_id", filteredArticleIds),
    countRowsByIds(client, "article_tags", "article_id", filteredArticleIds),
    countRowsByIds(client, "article_types", "article_id", filteredArticleIds),
    countRowsByIds(client, "youtube_video_subjects", "youtube_video_id", filteredVideoIds),
    countRowsByIds(client, "youtube_video_tags", "youtube_video_id", filteredVideoIds),
    countRowsByIds(client, "youtube_video_types", "youtube_video_id", filteredVideoIds),
  ]);

  const linksTotal = ag + at + agen + vg + vt + vgen;
  const linksPerContent = contentsTotal > 0 ? Number((linksTotal / contentsTotal).toFixed(2)) : 0;

  const sourceMix = [
    {
      tipo: "RSS" as const,
      fontes: rssSourceIds.size,
      conteudos: rssContents,
      share: contentsTotal > 0 ? Math.round((rssContents / contentsTotal) * 100) : 0,
    },
    {
      tipo: "YouTube" as const,
      fontes: ytSourceIds.size,
      conteudos: ytContents,
      share: contentsTotal > 0 ? Math.round((ytContents / contentsTotal) * 100) : 0,
    },
  ];

  const endMonth = new Date(`${periodEnd.slice(0, 10)}T00:00:00.000Z`);
  const monthlyEvolution: Array<{ mes: string; conteudos: number; vinculos: number }> = [];
  for (let offset = 2; offset >= 0; offset -= 1) {
    const d = new Date(endMonth);
    d.setUTCMonth(d.getUTCMonth() - offset, 1);
    const monthStart = d.toISOString().slice(0, 10);
    const monthEndDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const monthEnd = monthEndDate.toISOString().slice(0, 10);
    const metrics = await getFilteredWindowMetrics(client, monthStart, monthEnd, filters);
    monthlyEvolution.push({
      mes: formatMonthLabel(monthStart),
      conteudos: metrics.contents,
      vinculos: metrics.links,
    });
  }

  const artCount = filteredArticleIds.length;
  const vidCount = filteredVideoIds.length;
  const linkQuality = [
    {
      tipo: "Notícia RSS" as const,
      assuntos: artCount ? Number((ag / artCount).toFixed(2)) : 0,
      tags: artCount ? Number((at / artCount).toFixed(2)) : 0,
      tipos: artCount ? Number((agen / artCount).toFixed(2)) : 0,
    },
    {
      tipo: "Vídeo YouTube" as const,
      assuntos: vidCount ? Number((vg / vidCount).toFixed(2)) : 0,
      tags: vidCount ? Number((vt / vidCount).toFixed(2)) : 0,
      tipos: vidCount ? Number((vgen / vidCount).toFixed(2)) : 0,
    },
  ];

  const topClusters = await getTopTagClusters(client, filteredArticleIds, filteredVideoIds);

  const cadenceMap = new Map<number, { rss: number; youtube: number }>();
  for (let i = 0; i < 7; i += 1) cadenceMap.set(i, { rss: 0, youtube: 0 });
  for (const row of contentRows) {
    const day = new Date(row.published_at).getUTCDay();
    const current = cadenceMap.get(day) ?? { rss: 0, youtube: 0 };
    if (row.provider === "rss") current.rss += 1;
    else current.youtube += 1;
    cadenceMap.set(day, current);
  }
  const cadence = WEEKDAY_LABELS_PT.map((label, day) => ({
    dia: label,
    rss: cadenceMap.get(day)?.rss ?? 0,
    youtube: cadenceMap.get(day)?.youtube ?? 0,
  }));

  const cadenceBySource = computeCadenceBySourceWeekday(contentRows, sourcesById);
  const topCadenceSource = cadenceBySource[0];

  const leigosText =
    contentsTotal > 0
      ? `RSS representou ${sourceMix[0].share}% do volume e YouTube ${sourceMix[1].share}%, mostrando equilíbrio entre cobertura e profundidade.`
      : "Não há conteúdos no recorte de filtros selecionado; ajuste provedor ou fontes para ver o mix RSS x YouTube.";

  const relevanceScriptText =
    news_relevance.combined.total > 0
      ? `Foram recebidos ${news_relevance.combined.total} itens no período (todos com flag is_news). Destes, ${news_relevance.combined.subjects_context} foram classificados como relevantes para o hub (${news_relevance.combined.pct_subjects}%), e ${news_relevance.combined.generic} como genéricos ou off-topic. RSS: ${news_relevance.articles.total} itens (${news_relevance.articles.pct_subjects}% relevantes). YouTube: ${news_relevance.videos.total} (${news_relevance.videos.pct_subjects}% relevantes). A tabela “por fonte” mostra volume e percentual relevante por feed/canal.`
      : "Não há itens no recorte para análise de relevância (is_news); amplie período ou filtros.";

  return {
    summary: {
      period_start: periodStart,
      period_end: periodEnd,
      sources_total: sourceIdsInView.size,
      sources_rss: rssSourceIds.size,
      sources_youtube: ytSourceIds.size,
      contents_total: contentsTotal,
      articles_total: artCount,
      videos_total: vidCount,
      links_total: linksTotal,
      links_per_content: linksPerContent,
    },
    source_mix: sourceMix,
    monthly_evolution: monthlyEvolution,
    link_quality: linkQuality,
    top_clusters: topClusters,
    cadence,
    cadence_by_source: cadenceBySource,
    news_relevance,
    script: [
      {
        title: "Abertura",
        text: `No período, monitoramos ${sourceIdsInView.size} fontes e classificamos ${contentsTotal} conteúdos com ${linksTotal} vínculos editoriais.`,
      },
      {
        title: "Leitura para leigos",
        text: leigosText,
      },
      {
        title: "Relevância: games vs genérico (is_news)",
        text: relevanceScriptText,
      },
      {
        title: "Leitura para especialistas",
        text: `A densidade média de ${linksPerContent} vínculos por conteúdo indica maior maturidade taxonômica e melhor conectividade entre entidades.`,
      },
      ...(topCadenceSource
        ? [
            {
              title: "Cadência por fonte",
              text: `A fonte com maior volume no período foi “${topCadenceSource.source_name}” (${topCadenceSource.total} conteúdos). No gráfico por dia da semana dá para ver em quais dias ela costuma publicar mais ao longo do mês.`,
            },
          ]
        : []),
    ],
  };
}

