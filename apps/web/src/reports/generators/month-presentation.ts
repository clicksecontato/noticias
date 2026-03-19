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
    jogos: number;
    tags: number;
    generos: number;
    plataformas: number;
  }>;
  top_clusters: Array<{ cluster: string; citacoes: number }>;
  cadence: Array<{ dia: string; rss: number; youtube: number }>;
  script: Array<{ title: string; text: string }>;
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

async function getWindowMetrics(
  client: ReturnType<typeof createSupabaseClient>,
  startYmd: string,
  endYmd: string
): Promise<{ contents: number; links: number }> {
  const articles = await fetchArticleRows(client, startYmd, endYmd);
  const videos = await fetchVideoRows(client, startYmd, endYmd);
  const articleIds = articles.map((a) => a.id);
  const videoIds = videos.map((v) => v.id);

  const [ag, at, agen, ap, vg, vt, vgen, vp] = await Promise.all([
    countRowsByIds(client, "article_games", "article_id", articleIds),
    countRowsByIds(client, "article_tags", "article_id", articleIds),
    countRowsByIds(client, "article_genres", "article_id", articleIds),
    countRowsByIds(client, "article_platforms", "article_id", articleIds),
    countRowsByIds(client, "youtube_video_games", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_tags", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_genres", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_platforms", "youtube_video_id", videoIds),
  ]);

  return {
    contents: articles.length + videos.length,
    links: ag + at + agen + ap + vg + vt + vgen + vp,
  };
}

export async function generateMonthPresentationReport(
  periodStart: string,
  periodEnd: string
): Promise<MonthPresentationPayload> {
  const client = createSupabaseClient();

  const articles = await fetchArticleRows(client, periodStart, periodEnd);
  const videos = await fetchVideoRows(client, periodStart, periodEnd);

  const articleIds = articles.map((a) => a.id);
  const videoIds = videos.map((v) => v.id);
  const articleSourceMap = await mapArticleSources(client, articleIds);

  const sourceIds = new Set<string>([
    ...Array.from(articleSourceMap.values()),
    ...videos.map((v) => v.source_id),
  ]);
  const sourcesById = await getSourcesMap(client, Array.from(sourceIds));

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

  const rssSourceIds = new Set(contentRows.filter((c) => c.provider === "rss").map((c) => c.source_id));
  const ytSourceIds = new Set(contentRows.filter((c) => c.provider === "youtube").map((c) => c.source_id));
  const rssContents = contentRows.filter((c) => c.provider === "rss").length;
  const ytContents = contentRows.filter((c) => c.provider === "youtube").length;
  const contentsTotal = rssContents + ytContents;

  const [ag, at, agen, ap, vg, vt, vgen, vp] = await Promise.all([
    countRowsByIds(client, "article_games", "article_id", articleIds),
    countRowsByIds(client, "article_tags", "article_id", articleIds),
    countRowsByIds(client, "article_genres", "article_id", articleIds),
    countRowsByIds(client, "article_platforms", "article_id", articleIds),
    countRowsByIds(client, "youtube_video_games", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_tags", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_genres", "youtube_video_id", videoIds),
    countRowsByIds(client, "youtube_video_platforms", "youtube_video_id", videoIds),
  ]);

  const linksTotal = ag + at + agen + ap + vg + vt + vgen + vp;
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
    const metrics = await getWindowMetrics(client, monthStart, monthEnd);
    monthlyEvolution.push({
      mes: formatMonthLabel(monthStart),
      conteudos: metrics.contents,
      vinculos: metrics.links,
    });
  }

  const linkQuality = [
    {
      tipo: "Notícia RSS" as const,
      jogos: articles.length ? Number((ag / articles.length).toFixed(2)) : 0,
      tags: articles.length ? Number((at / articles.length).toFixed(2)) : 0,
      generos: articles.length ? Number((agen / articles.length).toFixed(2)) : 0,
      plataformas: articles.length ? Number((ap / articles.length).toFixed(2)) : 0,
    },
    {
      tipo: "Vídeo YouTube" as const,
      jogos: videos.length ? Number((vg / videos.length).toFixed(2)) : 0,
      tags: videos.length ? Number((vt / videos.length).toFixed(2)) : 0,
      generos: videos.length ? Number((vgen / videos.length).toFixed(2)) : 0,
      plataformas: videos.length ? Number((vp / videos.length).toFixed(2)) : 0,
    },
  ];

  const topClusters = await getTopTagClusters(client, articleIds, videoIds);

  const weekday = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const cadenceMap = new Map<number, { rss: number; youtube: number }>();
  for (let i = 0; i < 7; i += 1) cadenceMap.set(i, { rss: 0, youtube: 0 });
  for (const row of contentRows) {
    const day = new Date(row.published_at).getUTCDay();
    const current = cadenceMap.get(day) ?? { rss: 0, youtube: 0 };
    if (row.provider === "rss") current.rss += 1;
    else current.youtube += 1;
    cadenceMap.set(day, current);
  }
  const cadence = weekday.map((label, day) => ({
    dia: label,
    rss: cadenceMap.get(day)?.rss ?? 0,
    youtube: cadenceMap.get(day)?.youtube ?? 0,
  }));

  return {
    summary: {
      period_start: periodStart,
      period_end: periodEnd,
      sources_total: sourceIds.size,
      sources_rss: rssSourceIds.size,
      sources_youtube: ytSourceIds.size,
      contents_total: contentsTotal,
      articles_total: articles.length,
      videos_total: videos.length,
      links_total: linksTotal,
      links_per_content: linksPerContent,
    },
    source_mix: sourceMix,
    monthly_evolution: monthlyEvolution,
    link_quality: linkQuality,
    top_clusters: topClusters,
    cadence,
    script: [
      {
        title: "Abertura",
        text: `No período, monitoramos ${sourceIds.size} fontes e classificamos ${contentsTotal} conteúdos com ${linksTotal} vínculos editoriais.`,
      },
      {
        title: "Leitura para leigos",
        text: `RSS representou ${sourceMix[0].share}% do volume e YouTube ${sourceMix[1].share}%, mostrando equilíbrio entre cobertura e profundidade.`,
      },
      {
        title: "Leitura para especialistas",
        text: `A densidade média de ${linksPerContent} vínculos por conteúdo indica maior maturidade taxonômica e melhor conectividade entre entidades.`,
      },
    ],
  };
}

