import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "./config";
import {
  buildHubPipelineStats,
  type HubPipelineStats,
} from "./hub-pipeline-stats";

export type { HubPipelineStats };

export interface HubPipelineRepository {
  getHubPipelineStats(): Promise<HubPipelineStats>;
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countDistinctLinked(
  client: SupabaseClient,
  junctionTable: string,
  idColumn: string,
  newsIds: string[]
): Promise<number> {
  if (newsIds.length === 0) return 0;
  const linked = new Set<string>();
  const batchSize = 500;
  for (let i = 0; i < newsIds.length; i += batchSize) {
    const batch = newsIds.slice(i, i + batchSize);
    const { data, error } = await client
      .from(junctionTable)
      .select(idColumn)
      .in(idColumn, batch);
    if (error) {
      throw new Error(`Failed to fetch ${junctionTable}: ${error.message}`);
    }
    for (const row of data ?? []) {
      const id = (row as Record<string, string>)[idColumn];
      if (id) linked.add(id);
    }
  }
  return linked.size;
}

async function listNewsIds(
  client: SupabaseClient,
  table: string
): Promise<string[]> {
  const { data, error } = await client.from(table).select("id").eq("is_news", true);
  if (error) throw new Error(`Failed to list ${table} ids: ${error.message}`);
  return (data ?? []).map((r) => r.id as string);
}

function createSupabaseHubPipelineRepository(): HubPipelineRepository {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
  if (!url || !key) {
    throw new Error("Supabase credentials missing for hub pipeline stats");
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async getHubPipelineStats() {
      const generatedAt = new Date().toISOString();
      const end = new Date();
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      const periodStart = `${start.toISOString().slice(0, 10)}T00:00:00.000Z`;
      const periodEndExclusive = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1)
      ).toISOString();

      const { data: sourcesRows, error: sourcesError } = await client
        .from("sources")
        .select(
          "provider,is_active,last_ingested_at,last_ingestion_duration_ms"
        );
      if (sourcesError) {
        throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
      }

      const [
        subjects,
        tags,
        types,
        articlesTotal,
        articlesNews,
        videosTotal,
        videosNews,
        recentArticles,
        recentVideos,
        articleNewsIds,
        videoNewsIds,
      ] = await Promise.all([
        countRows(client.from("subjects").select("*", { count: "exact", head: true })),
        countRows(client.from("tags").select("*", { count: "exact", head: true })),
        countRows(client.from("types").select("*", { count: "exact", head: true })),
        countRows(client.from("articles").select("*", { count: "exact", head: true })),
        countRows(
          client
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("is_news", true)
        ),
        countRows(
          client.from("youtube_videos").select("*", { count: "exact", head: true })
        ),
        countRows(
          client
            .from("youtube_videos")
            .select("*", { count: "exact", head: true })
            .eq("is_news", true)
        ),
        countRows(
          client
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("is_news", true)
            .gte("published_at", periodStart)
            .lt("published_at", periodEndExclusive)
        ),
        countRows(
          client
            .from("youtube_videos")
            .select("*", { count: "exact", head: true })
            .eq("is_news", true)
            .gte("published_at", periodStart)
            .lt("published_at", periodEndExclusive)
        ),
        listNewsIds(client, "articles"),
        listNewsIds(client, "youtube_videos"),
      ]);

      const [
        articlesWithSubject,
        articlesWithTag,
        videosWithSubject,
        videosWithTag,
      ] = await Promise.all([
        countDistinctLinked(client, "article_subjects", "article_id", articleNewsIds),
        countDistinctLinked(client, "article_tags", "article_id", articleNewsIds),
        countDistinctLinked(
          client,
          "youtube_video_subjects",
          "youtube_video_id",
          videoNewsIds
        ),
        countDistinctLinked(
          client,
          "youtube_video_tags",
          "youtube_video_id",
          videoNewsIds
        ),
      ]);

      return buildHubPipelineStats({
        generatedAt,
        sources: (sourcesRows ?? []).map((row) => ({
          provider: row.provider ?? "rss",
          isActive: row.is_active === true,
          lastIngestedAt: row.last_ingested_at ?? null,
          lastIngestionDurationMs: row.last_ingestion_duration_ms ?? null,
        })),
        catalog: { subjects, tags, types },
        content: {
          articlesTotal,
          articlesNews,
          videosTotal,
          videosNews,
        },
        enrichment: {
          articlesWithSubject,
          articlesWithTag,
          videosWithSubject,
          videosWithTag,
        },
        recent7d: { articles: recentArticles, videos: recentVideos },
      });
    },
  };
}

function createMemoryHubPipelineRepository(): HubPipelineRepository {
  return {
    async getHubPipelineStats() {
      return buildHubPipelineStats({
        generatedAt: new Date().toISOString(),
        sources: [],
        catalog: { subjects: 0, tags: 0, types: 0 },
        content: {
          articlesTotal: 0,
          articlesNews: 0,
          videosTotal: 0,
          videosNews: 0,
        },
        enrichment: {
          articlesWithSubject: 0,
          articlesWithTag: 0,
          videosWithSubject: 0,
          videosWithTag: 0,
        },
        recent7d: { articles: 0, videos: 0 },
      });
    },
  };
}

export function createHubPipelineRepository(): HubPipelineRepository {
  const config = getDatabaseConfig();
  return config.contentSource === "supabase"
    ? createSupabaseHubPipelineRepository()
    : createMemoryHubPipelineRepository();
}
