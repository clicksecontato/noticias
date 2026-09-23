/**
 * Contrato puro das estatísticas do hub (transparência do pipeline).
 * Agrega counts brutos — sem I/O.
 */

export type HubPipelineStatsInput = {
  sources: Array<{
    provider: "rss" | "youtube" | string;
    isActive: boolean;
    lastIngestedAt?: string | null;
    lastIngestionDurationMs?: number | null;
  }>;
  catalog: { subjects: number; tags: number; types: number };
  content: {
    articlesTotal: number;
    articlesNews: number;
    videosTotal: number;
    videosNews: number;
  };
  enrichment: {
    articlesWithSubject: number;
    articlesWithTag: number;
    videosWithSubject: number;
    videosWithTag: number;
  };
  recent7d: { articles: number; videos: number };
  /** ISO timestamp de geração (injetável nos testes). */
  generatedAt: string;
  /** Fontes quietas: ativas sem ingestão nos últimos N dias (default 7). */
  quietDays?: number;
};

export type HubPipelineStats = {
  generated_at: string;
  sources: {
    active_total: number;
    active_rss: number;
    active_youtube: number;
    last_ingested_at: string | null;
    avg_ingestion_duration_ms: number | null;
    quiet_sources: number;
  };
  catalog: {
    subjects: number;
    tags: number;
    types: number;
  };
  content: {
    articles_total: number;
    articles_news: number;
    articles_news_pct: number;
    videos_total: number;
    videos_news: number;
    videos_news_pct: number;
  };
  enrichment: {
    articles_with_subject_pct: number;
    articles_with_tag_pct: number;
    videos_with_subject_pct: number;
    videos_with_tag_pct: number;
  };
  recent_7d: {
    articles: number;
    videos: number;
    total: number;
  };
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function clampCount(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function buildHubPipelineStats(input: HubPipelineStatsInput): HubPipelineStats {
  const quietDays = input.quietDays ?? 7;
  const generatedMs = Date.parse(input.generatedAt);
  const quietCutoffMs = Number.isFinite(generatedMs)
    ? generatedMs - quietDays * 86_400_000
    : 0;

  const active = input.sources.filter((s) => s.isActive);
  const activeRss = active.filter((s) => s.provider === "rss").length;
  const activeYoutube = active.filter((s) => s.provider === "youtube").length;

  const withTiming = active.filter(
    (s) =>
      typeof s.lastIngestionDurationMs === "number" &&
      Number.isFinite(s.lastIngestionDurationMs) &&
      (s.lastIngestionDurationMs as number) >= 0
  );
  const avgDuration =
    withTiming.length === 0
      ? null
      : Math.round(
          withTiming.reduce((sum, s) => sum + (s.lastIngestionDurationMs as number), 0) /
            withTiming.length
        );

  let lastIngested: string | null = null;
  for (const s of active) {
    const at = s.lastIngestedAt;
    if (!at) continue;
    if (!lastIngested || at > lastIngested) lastIngested = at;
  }

  const quietSources = active.filter((s) => {
    if (!s.lastIngestedAt) return true;
    const t = Date.parse(s.lastIngestedAt);
    if (!Number.isFinite(t)) return true;
    return t < quietCutoffMs;
  }).length;

  const articlesTotal = clampCount(input.content.articlesTotal);
  const articlesNews = clampCount(input.content.articlesNews);
  const videosTotal = clampCount(input.content.videosTotal);
  const videosNews = clampCount(input.content.videosNews);

  const articlesWithSubject = Math.min(
    clampCount(input.enrichment.articlesWithSubject),
    articlesNews
  );
  const articlesWithTag = Math.min(
    clampCount(input.enrichment.articlesWithTag),
    articlesNews
  );
  const videosWithSubject = Math.min(
    clampCount(input.enrichment.videosWithSubject),
    videosNews
  );
  const videosWithTag = Math.min(
    clampCount(input.enrichment.videosWithTag),
    videosNews
  );

  const recentArticles = clampCount(input.recent7d.articles);
  const recentVideos = clampCount(input.recent7d.videos);

  return {
    generated_at: input.generatedAt,
    sources: {
      active_total: active.length,
      active_rss: activeRss,
      active_youtube: activeYoutube,
      last_ingested_at: lastIngested,
      avg_ingestion_duration_ms: avgDuration,
      quiet_sources: quietSources,
    },
    catalog: {
      subjects: clampCount(input.catalog.subjects),
      tags: clampCount(input.catalog.tags),
      types: clampCount(input.catalog.types),
    },
    content: {
      articles_total: articlesTotal,
      articles_news: articlesNews,
      articles_news_pct: pct(articlesNews, articlesTotal),
      videos_total: videosTotal,
      videos_news: videosNews,
      videos_news_pct: pct(videosNews, videosTotal),
      },
    enrichment: {
      articles_with_subject_pct: pct(articlesWithSubject, articlesNews),
      articles_with_tag_pct: pct(articlesWithTag, articlesNews),
      videos_with_subject_pct: pct(videosWithSubject, videosNews),
      videos_with_tag_pct: pct(videosWithTag, videosNews),
    },
    recent_7d: {
      articles: recentArticles,
      videos: recentVideos,
      total: recentArticles + recentVideos,
    },
  };
}
