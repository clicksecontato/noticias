import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "./config";
import type {
  ReportRecord,
  ReportWithResult,
  ReportListItem,
  ReportType,
  ReportStatus,
  ArticleRowForReport,
  VideoRowForReport
} from "./report-types";

export interface CreateReportInput {
  report_type: ReportType;
  period_start: string;
  period_end: string;
  parameters?: Record<string, unknown>;
}

export interface ListReportsInput {
  type?: ReportType;
  status?: ReportStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReportsOutput {
  items: ReportListItem[];
  total: number;
}

/** Filtros opcionais para relatórios (jogo, tag, gênero, plataforma). */
export interface ReportFilters {
  gameId?: string;
  tagId?: string;
  genreId?: string;
  platformId?: string;
  sourceId?: string;
}

export interface ReportRepository {
  createReport(input: CreateReportInput): Promise<string>;
  updateReportStatus(
    id: string,
    status: ReportStatus,
    options?: { error_message?: string; generated_at?: string }
  ): Promise<void>;
  saveReportResult(reportId: string, payload: Record<string, unknown>): Promise<void>;
  getReportById(id: string): Promise<ReportWithResult | null>;
  listReports(input: ListReportsInput): Promise<ListReportsOutput>;
  getArticlesForReports(
    periodStart: string,
    periodEnd: string,
    filters?: ReportFilters
  ): Promise<ArticleRowForReport[]>;
  getVideosForReports(
    periodStart: string,
    periodEnd: string,
    filters?: ReportFilters
  ): Promise<VideoRowForReport[]>;
  getSourceIdToName(): Promise<Map<string, string>>;
  /** Contagem de notícias (artigos) por tag no período. Sem fontes. */
  getTagCountsForReports(
    periodStart: string,
    periodEnd: string,
    filters?: ReportFilters
  ): Promise<Array<{ tag_id: string; tag_name: string; count: number }>>;
  /** Contagem de artigos e vídeos por jogo no período (para relatório top_games). */
  getGameCountsForReports(
    periodStart: string,
    periodEnd: string,
    filters?: ReportFilters
  ): Promise<Array<{ game_id: string; game_name: string; articles: number; videos: number; total: number }>>;
}

/** Início do dia em UTC quando a string é só data (YYYY-MM-DD). */
function normalizePeriodStart(s: string): string {
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s + "T00:00:00.000Z";
  }
  return s;
}

/** Início do dia seguinte em UTC para usar com .lt() e incluir o dia inteiro até 23:59:59. */
function periodEndExclusive(s: string): string {
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00.000Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
  }
  return s;
}

function createSupabaseReportRepository(): ReportRepository {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) {
    throw new Error("Supabase URL and key required for report repository");
  }
  const client = createClient(url, key);

  return {
    async createReport(input) {
      const { data, error } = await client
        .from("reports")
        .insert({
          report_type: input.report_type,
          period_start: input.period_start,
          period_end: input.period_end,
          parameters: input.parameters ?? {},
          status: "pending"
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create report: ${error.message}`);
      return data.id;
    },

    async updateReportStatus(id, status, options) {
      const body: Record<string, unknown> = { status };
      if (options?.error_message !== undefined) body.error_message = options.error_message;
      if (options?.generated_at !== undefined) body.generated_at = options.generated_at;
      const { error } = await client.from("reports").update(body).eq("id", id);
      if (error) throw new Error(`Failed to update report: ${error.message}`);
    },

    async saveReportResult(reportId, payload) {
      const { error } = await client.from("report_results").upsert(
        { report_id: reportId, payload },
        { onConflict: "report_id" }
      );
      if (error) throw new Error(`Failed to save report result: ${error.message}`);
    },

    async getReportById(id) {
      const { data: report, error: reportError } = await client
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (reportError || !report) return null;
      const { data: result } = await client
        .from("report_results")
        .select("payload")
        .eq("report_id", id)
        .maybeSingle();
      return {
        id: report.id,
        report_type: report.report_type,
        period_start: report.period_start,
        period_end: report.period_end,
        parameters: report.parameters ?? {},
        status: report.status,
        error_message: report.error_message,
        generated_at: report.generated_at,
        created_at: report.created_at,
        result: result ? { payload: result.payload } : null
      };
    },

    async listReports(input) {
      const page = Math.max(1, input.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
      const from = (page - 1) * pageSize;

      let query = client.from("reports").select("id,report_type,period_start,period_end,status,generated_at,created_at", { count: "exact" });
      if (input.type) query = query.eq("report_type", input.type);
      if (input.status) query = query.eq("status", input.status);
      if (input.from) query = query.gte("period_start", input.from);
      if (input.to) query = query.lte("period_end", input.to);
      query = query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw new Error(`Failed to list reports: ${error.message}`);
      const items = (data || []).map((row) => ({
        id: row.id,
        report_type: row.report_type,
        period_start: row.period_start,
        period_end: row.period_end,
        status: row.status,
        generated_at: row.generated_at,
        created_at: row.created_at
      }));
      return { items, total: count ?? 0 };
    },

    async getArticlesForReports(periodStart, periodEnd, filters) {
      const start = normalizePeriodStart(periodStart);
      const endExclusive = periodEndExclusive(periodEnd);
      const { data: articles, error: articlesError } = await client
        .from("articles")
        .select("id, published_at")
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let list = articles ?? [];

      if (filters?.gameId) {
        const { data: gameLinks } = await client
          .from("article_games")
          .select("article_id")
          .eq("game_id", filters.gameId);
        const ids = new Set((gameLinks || []).map((l) => l.article_id));
        list = list.filter((a) => ids.has(a.id));
      }
      if (filters?.tagId) {
        const { data: tagLinks } = await client
          .from("article_tags")
          .select("article_id")
          .eq("tag_id", filters.tagId);
        const ids = new Set((tagLinks || []).map((l) => l.article_id));
        list = list.filter((a) => ids.has(a.id));
      }
      if (filters?.genreId) {
        const { data: genreLinks } = await client
          .from("article_genres")
          .select("article_id")
          .eq("genre_id", filters.genreId);
        const ids = new Set((genreLinks || []).map((l) => l.article_id));
        list = list.filter((a) => ids.has(a.id));
      }
      if (filters?.platformId) {
        const { data: platformLinks } = await client
          .from("article_platforms")
          .select("article_id")
          .eq("platform_id", filters.platformId);
        const ids = new Set((platformLinks || []).map((l) => l.article_id));
        list = list.filter((a) => ids.has(a.id));
      }

      if (list.length === 0) return [];
      const ids = list.map((a) => a.id);
      const { data: links } = await client
        .from("article_sources")
        .select("article_id, source_id")
        .in("article_id", ids);
      const firstSourceByArticle = new Map<string, string>();
      for (const link of links || []) {
        if (!firstSourceByArticle.has(link.article_id)) {
          firstSourceByArticle.set(link.article_id, link.source_id);
        }
      }
      const articleById = new Map(list.map((a) => [a.id, a]));
      const out: ArticleRowForReport[] = [];
      for (const [articleId, sourceId] of firstSourceByArticle) {
        const a = articleById.get(articleId);
        if (a?.published_at) out.push({ published_at: a.published_at, source_id: sourceId });
      }
      return out;
    },

    async getVideosForReports(periodStart, periodEnd, filters) {
      const start = normalizePeriodStart(periodStart);
      const endExclusive = periodEndExclusive(periodEnd);
      const { data: videos, error } = await client
        .from("youtube_videos")
        .select("id, published_at, source_id")
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
      let list = videos ?? [];

      if (filters?.gameId) {
        const { data: gameLinks } = await client
          .from("youtube_video_games")
          .select("youtube_video_id")
          .eq("game_id", filters.gameId);
        const ids = new Set((gameLinks || []).map((l) => l.youtube_video_id));
        list = list.filter((v) => ids.has(v.id));
      }
      if (filters?.tagId) {
        const { data: tagLinks } = await client
          .from("youtube_video_tags")
          .select("youtube_video_id")
          .eq("tag_id", filters.tagId);
        const ids = new Set((tagLinks || []).map((l) => l.youtube_video_id));
        list = list.filter((v) => ids.has(v.id));
      }
      if (filters?.genreId) {
        const { data: genreLinks } = await client
          .from("youtube_video_genres")
          .select("youtube_video_id")
          .eq("genre_id", filters.genreId);
        const ids = new Set((genreLinks || []).map((l) => l.youtube_video_id));
        list = list.filter((v) => ids.has(v.id));
      }
      if (filters?.platformId) {
        const { data: platformLinks } = await client
          .from("youtube_video_platforms")
          .select("youtube_video_id")
          .eq("platform_id", filters.platformId);
        const ids = new Set((platformLinks || []).map((l) => l.youtube_video_id));
        list = list.filter((v) => ids.has(v.id));
      }

      return list.map((row) => ({
        published_at: row.published_at,
        source_id: row.source_id
      }));
    },

    async getSourceIdToName() {
      const { data, error } = await client.from("sources").select("id, name");
      if (error) throw new Error(`Failed to fetch sources: ${error.message}`);
      const map = new Map<string, string>();
      for (const row of data || []) {
        map.set(row.id, row.name);
      }
      return map;
    },

    async getTagCountsForReports(periodStart, periodEnd, filters) {
      const start = normalizePeriodStart(periodStart);
      const endExclusive = periodEndExclusive(periodEnd);
      const { data: articles, error: articlesError } = await client
        .from("articles")
        .select("id")
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let articleIds = (articles ?? []).map((a) => a.id);
      if (articleIds.length === 0) return [];

      if (filters?.gameId) {
        const { data: gameLinks } = await client
          .from("article_games")
          .select("article_id")
          .eq("game_id", filters.gameId)
          .in("article_id", articleIds);
        const ids = new Set((gameLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.tagId) {
        const { data: tagLinks } = await client
          .from("article_tags")
          .select("article_id")
          .eq("tag_id", filters.tagId)
          .in("article_id", articleIds);
        const ids = new Set((tagLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.genreId) {
        const { data: genreLinks } = await client
          .from("article_genres")
          .select("article_id")
          .eq("genre_id", filters.genreId)
          .in("article_id", articleIds);
        const ids = new Set((genreLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.platformId) {
        const { data: platformLinks } = await client
          .from("article_platforms")
          .select("article_id")
          .eq("platform_id", filters.platformId)
          .in("article_id", articleIds);
        const ids = new Set((platformLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.sourceId) {
        const { data: sourceLinks, error: sourceError } = await client
          .from("article_sources")
          .select("article_id")
          .eq("source_id", filters.sourceId)
          .in("article_id", articleIds);
        if (sourceError) throw new Error(`Failed to fetch article_sources: ${sourceError.message}`);
        const ids = new Set((sourceLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (articleIds.length === 0) return [];

      const batchSize = 500;
      const allTagCounts = new Map<string, number>();
      for (let i = 0; i < articleIds.length; i += batchSize) {
        const batch = articleIds.slice(i, i + batchSize);
        const { data: links, error: linksError } = await client
          .from("article_tags")
          .select("tag_id")
          .in("article_id", batch);
        if (linksError) throw new Error(`Failed to fetch article_tags: ${linksError.message}`);
        for (const row of links ?? []) {
          allTagCounts.set(row.tag_id, (allTagCounts.get(row.tag_id) ?? 0) + 1);
        }
      }
      const tagIds = Array.from(allTagCounts.keys());
      if (tagIds.length === 0) return [];
      const { data: tagsRows, error: tagsError } = await client
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      if (tagsError) throw new Error(`Failed to fetch tags: ${tagsError.message}`);
      const nameById = new Map((tagsRows ?? []).map((r) => [r.id, r.name ?? r.id]));
      return tagIds
        .map((tag_id) => ({
          tag_id,
          tag_name: nameById.get(tag_id) ?? tag_id,
          count: allTagCounts.get(tag_id) ?? 0
        }))
        .sort((a, b) => b.count - a.count);
    },

    async getGameCountsForReports(periodStart, periodEnd, filters) {
      const start = normalizePeriodStart(periodStart);
      const endExclusive = periodEndExclusive(periodEnd);
      const { data: articles, error: articlesError } = await client
        .from("articles")
        .select("id")
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let articleIds = (articles ?? []).map((a) => a.id);

      const { data: videos, error: videosError } = await client
        .from("youtube_videos")
        .select("id, source_id")
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (videosError) throw new Error(`Failed to fetch videos: ${videosError.message}`);
      let videoIds = (videos ?? []).map((v) => v.id);

      if (filters?.gameId) {
        if (articleIds.length > 0) {
          const { data: gameLinks } = await client
            .from("article_games")
            .select("article_id")
            .eq("game_id", filters.gameId)
            .in("article_id", articleIds);
          const ids = new Set((gameLinks || []).map((l) => l.article_id));
          articleIds = articleIds.filter((id) => ids.has(id));
        }
        if (videoIds.length > 0) {
          const { data: gameLinks } = await client
            .from("youtube_video_games")
            .select("youtube_video_id")
            .eq("game_id", filters.gameId)
            .in("youtube_video_id", videoIds);
          const ids = new Set((gameLinks || []).map((l) => l.youtube_video_id));
          videoIds = videoIds.filter((id) => ids.has(id));
        }
      }
      if (articleIds.length > 0 && filters?.tagId) {
        const { data: tagLinks } = await client
          .from("article_tags")
          .select("article_id")
          .eq("tag_id", filters.tagId)
          .in("article_id", articleIds);
        const ids = new Set((tagLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (videoIds.length > 0 && filters?.tagId) {
        const { data: tagLinks } = await client
          .from("youtube_video_tags")
          .select("youtube_video_id")
          .eq("tag_id", filters.tagId)
          .in("youtube_video_id", videoIds);
        const ids = new Set((tagLinks || []).map((l) => l.youtube_video_id));
        videoIds = videoIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.genreId) {
        const { data: genreLinks } = await client
          .from("article_genres")
          .select("article_id")
          .eq("genre_id", filters.genreId)
          .in("article_id", articleIds);
        const ids = new Set((genreLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (videoIds.length > 0 && filters?.genreId) {
        const { data: genreLinks } = await client
          .from("youtube_video_genres")
          .select("youtube_video_id")
          .eq("genre_id", filters.genreId)
          .in("youtube_video_id", videoIds);
        const ids = new Set((genreLinks || []).map((l) => l.youtube_video_id));
        videoIds = videoIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.platformId) {
        const { data: platformLinks } = await client
          .from("article_platforms")
          .select("article_id")
          .eq("platform_id", filters.platformId)
          .in("article_id", articleIds);
        const ids = new Set((platformLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (videoIds.length > 0 && filters?.platformId) {
        const { data: platformLinks } = await client
          .from("youtube_video_platforms")
          .select("youtube_video_id")
          .eq("platform_id", filters.platformId)
          .in("youtube_video_id", videoIds);
        const ids = new Set((platformLinks || []).map((l) => l.youtube_video_id));
        videoIds = videoIds.filter((id) => ids.has(id));
      }
      if (articleIds.length > 0 && filters?.sourceId) {
        const { data: sourceLinks } = await client
          .from("article_sources")
          .select("article_id")
          .eq("source_id", filters.sourceId)
          .in("article_id", articleIds);
        const ids = new Set((sourceLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (videoIds.length > 0 && filters?.sourceId) {
        const withSource = (videos ?? []).filter(
          (v: { id: string; source_id?: string }) => v.source_id === filters?.sourceId
        );
        videoIds = withSource.map((v: { id: string }) => v.id);
      }

      const gameCounts = new Map<string, { articles: number; videos: number }>();

      if (articleIds.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < articleIds.length; i += batchSize) {
          const batch = articleIds.slice(i, i + batchSize);
          const { data: links, error: linksError } = await client
            .from("article_games")
            .select("game_id")
            .in("article_id", batch);
          if (linksError) throw new Error(`Failed to fetch article_games: ${linksError.message}`);
          for (const row of links ?? []) {
            const cur = gameCounts.get(row.game_id) ?? { articles: 0, videos: 0 };
            cur.articles += 1;
            gameCounts.set(row.game_id, cur);
          }
        }
      }
      if (videoIds.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < videoIds.length; i += batchSize) {
          const batch = videoIds.slice(i, i + batchSize);
          const { data: links, error: linksError } = await client
            .from("youtube_video_games")
            .select("game_id")
            .in("youtube_video_id", batch);
          if (linksError) throw new Error(`Failed to fetch youtube_video_games: ${linksError.message}`);
          for (const row of links ?? []) {
            const cur = gameCounts.get(row.game_id) ?? { articles: 0, videos: 0 };
            cur.videos += 1;
            gameCounts.set(row.game_id, cur);
          }
        }
      }

      const gameIds = Array.from(gameCounts.keys());
      if (gameIds.length === 0) return [];

      const { data: gamesRows, error: gamesError } = await client
        .from("games")
        .select("id, name")
        .in("id", gameIds);
      if (gamesError) throw new Error(`Failed to fetch games: ${gamesError.message}`);
      const nameById = new Map((gamesRows ?? []).map((r) => [r.id, r.name ?? r.id]));

      return gameIds
        .map((game_id) => {
          const counts = gameCounts.get(game_id)!;
          const total = counts.articles + counts.videos;
          return {
            game_id,
            game_name: nameById.get(game_id) ?? game_id,
            articles: counts.articles,
            videos: counts.videos,
            total,
          };
        })
        .sort((a, b) => b.total - a.total);
    },
  };
}

function createMemoryReportRepository(): ReportRepository {
  return {
    async createReport() {
      return "memory-report-1";
    },
    async updateReportStatus() {},
    async saveReportResult() {},
    async getReportById() {
      return null;
    },
    async listReports() {
      return { items: [], total: 0 };
    },
    async getArticlesForReports(_periodStart, _periodEnd, _filters?) {
      return [];
    },
    async getVideosForReports(_periodStart, _periodEnd, _filters?) {
      return [];
    },
    async getSourceIdToName() {
      return new Map();
    },
    async getTagCountsForReports() {
      return [];
    },
    async getGameCountsForReports() {
      return [];
    },
  };
}

export function createReportRepository(): ReportRepository {
  const config = getDatabaseConfig();
  return config.contentSource === "supabase"
    ? createSupabaseReportRepository()
    : createMemoryReportRepository();
}
