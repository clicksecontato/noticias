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

/** Filtros opcionais para relatórios (assunto, tag, tipo). */
export interface ReportFilters {
  subjectId?: string;
  tagId?: string;
  typeId?: string;
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
  /** Contagem de artigos e vídeos por assunto no período (para relatório top_subjects). */
  getSubjectCountsForReports(
    periodStart: string,
    periodEnd: string,
    filters?: ReportFilters
  ): Promise<Array<{ subject_id: string; subject_name: string; articles: number; videos: number; total: number }>>;
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
        .eq("is_news", true)
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let list = articles ?? [];

      if (filters?.subjectId) {
        const { data: subjectLinks } = await client
          .from("article_subjects")
          .select("article_id")
          .eq("subject_id", filters.subjectId);
        const ids = new Set((subjectLinks || []).map((l) => l.article_id));
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
      if (filters?.typeId) {
        const { data: typeLinks } = await client
          .from("article_types")
          .select("article_id")
          .eq("type_id", filters.typeId);
        const ids = new Set((typeLinks || []).map((l) => l.article_id));
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
        .eq("is_news", true)
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
      let list = videos ?? [];

      if (filters?.subjectId) {
        const { data: subjectLinks } = await client
          .from("youtube_video_subjects")
          .select("youtube_video_id")
          .eq("subject_id", filters.subjectId);
        const ids = new Set((subjectLinks || []).map((l) => l.youtube_video_id));
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
      if (filters?.typeId) {
        const { data: typeLinks } = await client
          .from("youtube_video_types")
          .select("youtube_video_id")
          .eq("type_id", filters.typeId);
        const ids = new Set((typeLinks || []).map((l) => l.youtube_video_id));
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
        .eq("is_news", true)
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let articleIds = (articles ?? []).map((a) => a.id);
      if (articleIds.length === 0) return [];

      if (filters?.subjectId) {
        const { data: subjectLinks } = await client
          .from("article_subjects")
          .select("article_id")
          .eq("subject_id", filters.subjectId)
          .in("article_id", articleIds);
        const ids = new Set((subjectLinks || []).map((l) => l.article_id));
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
      if (articleIds.length > 0 && filters?.typeId) {
        const { data: typeLinks } = await client
          .from("article_types")
          .select("article_id")
          .eq("type_id", filters.typeId)
          .in("article_id", articleIds);
        const ids = new Set((typeLinks || []).map((l) => l.article_id));
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

    async getSubjectCountsForReports(periodStart, periodEnd, filters) {
      const start = normalizePeriodStart(periodStart);
      const endExclusive = periodEndExclusive(periodEnd);
      const { data: articles, error: articlesError } = await client
        .from("articles")
        .select("id")
        .eq("is_news", true)
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`);
      let articleIds = (articles ?? []).map((a) => a.id);

      const { data: videos, error: videosError } = await client
        .from("youtube_videos")
        .select("id, source_id")
        .eq("is_news", true)
        .gte("published_at", start)
        .lt("published_at", endExclusive);
      if (videosError) throw new Error(`Failed to fetch videos: ${videosError.message}`);
      let videoIds = (videos ?? []).map((v) => v.id);

      if (filters?.subjectId) {
        if (articleIds.length > 0) {
          const { data: subjectLinks } = await client
            .from("article_subjects")
            .select("article_id")
            .eq("subject_id", filters.subjectId)
            .in("article_id", articleIds);
          const ids = new Set((subjectLinks || []).map((l) => l.article_id));
          articleIds = articleIds.filter((id) => ids.has(id));
        }
        if (videoIds.length > 0) {
          const { data: subjectLinks } = await client
            .from("youtube_video_subjects")
            .select("youtube_video_id")
            .eq("subject_id", filters.subjectId)
            .in("youtube_video_id", videoIds);
          const ids = new Set((subjectLinks || []).map((l) => l.youtube_video_id));
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
      if (articleIds.length > 0 && filters?.typeId) {
        const { data: typeLinks } = await client
          .from("article_types")
          .select("article_id")
          .eq("type_id", filters.typeId)
          .in("article_id", articleIds);
        const ids = new Set((typeLinks || []).map((l) => l.article_id));
        articleIds = articleIds.filter((id) => ids.has(id));
      }
      if (videoIds.length > 0 && filters?.typeId) {
        const { data: typeLinks } = await client
          .from("youtube_video_types")
          .select("youtube_video_id")
          .eq("type_id", filters.typeId)
          .in("youtube_video_id", videoIds);
        const ids = new Set((typeLinks || []).map((l) => l.youtube_video_id));
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

      const subjectCounts = new Map<string, { articles: number; videos: number }>();

      if (articleIds.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < articleIds.length; i += batchSize) {
          const batch = articleIds.slice(i, i + batchSize);
          const { data: links, error: linksError } = await client
            .from("article_subjects")
            .select("subject_id")
            .in("article_id", batch);
          if (linksError) throw new Error(`Failed to fetch article_subjects: ${linksError.message}`);
          for (const row of links ?? []) {
            const cur = subjectCounts.get(row.subject_id) ?? { articles: 0, videos: 0 };
            cur.articles += 1;
            subjectCounts.set(row.subject_id, cur);
          }
        }
      }
      if (videoIds.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < videoIds.length; i += batchSize) {
          const batch = videoIds.slice(i, i + batchSize);
          const { data: links, error: linksError } = await client
            .from("youtube_video_subjects")
            .select("subject_id")
            .in("youtube_video_id", batch);
          if (linksError) throw new Error(`Failed to fetch youtube_video_subjects: ${linksError.message}`);
          for (const row of links ?? []) {
            const cur = subjectCounts.get(row.subject_id) ?? { articles: 0, videos: 0 };
            cur.videos += 1;
            subjectCounts.set(row.subject_id, cur);
          }
        }
      }

      const subjectIds = Array.from(subjectCounts.keys());
      if (subjectIds.length === 0) return [];

      const { data: subjectsRows, error: subjectsError } = await client
        .from("subjects")
        .select("id, name")
        .in("id", subjectIds);
      if (subjectsError) throw new Error(`Failed to fetch subjects: ${subjectsError.message}`);
      const nameById = new Map((subjectsRows ?? []).map((r) => [r.id, r.name ?? r.id]));

      return subjectIds
        .map((subject_id) => {
          const counts = subjectCounts.get(subject_id)!;
          const total = counts.articles + counts.videos;
          return {
            subject_id,
            subject_name: nameById.get(subject_id) ?? subject_id,
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
    async getSubjectCountsForReports() {
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
