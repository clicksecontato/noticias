import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";

function getClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

function dateToEndExclusive(dateTo: string): string {
  const d = new Date(dateTo + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export interface VideoListRow {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
  url: string;
  gameNames: string[];
  tagNames: string[];
  genreNames: string[];
  platformNames: string[];
}

export interface VideoEditRow {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  url: string;
  sourceId: string;
  sourceName: string;
  is_news: boolean;
  gameIds: string[];
  tagIds: string[];
  genreIds: string[];
  platformIds: string[];
}

export interface SourceOption {
  id: string;
  name: string;
}

export interface ListVideosFilters {
  limit?: number;
  offset?: number;
  sourceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const videosRepository = {
  async listSources(): Promise<SourceOption[]> {
    const { data, error } = await getClient()
      .from("sources")
      .select("id,name")
      .eq("is_active", true)
      .eq("provider", "youtube")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as SourceOption[];
  },

  async countVideos(filters: ListVideosFilters = {}): Promise<number> {
    const client = getClient();
    const { sourceId, dateFrom, dateTo } = filters;

    let query = client.from("youtube_videos").select("id", { count: "exact", head: true });
    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));
    if (sourceId) query = query.eq("source_id", sourceId);

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listVideos(
    limit = 100,
    offset = 0,
    filters: Omit<ListVideosFilters, "limit" | "offset"> = {}
  ): Promise<VideoListRow[]> {
    const client = getClient();
    const { sourceId, dateFrom, dateTo } = filters;

    let query = client
      .from("youtube_videos")
      .select("id,title,description,published_at,url,source_id,is_news")
      .order("published_at", { ascending: false });

    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));
    if (sourceId) query = query.eq("source_id", sourceId);

    const { data: rows, error } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    const videos = (rows ?? []) as Array<{
      id: string;
      title: string;
      description: string | null;
      published_at: string;
      url: string;
      source_id: string;
      is_news: boolean;
    }>;
    if (videos.length === 0) return [];

    const ids = videos.map((v) => v.id);
    const [sourcesRows, yvg, yvt, yvgen, yvp] = await Promise.all([
      client.from("sources").select("id,name"),
      client.from("youtube_video_games").select("youtube_video_id, games(name)").in("youtube_video_id", ids),
      client.from("youtube_video_tags").select("youtube_video_id, tags(name)").in("youtube_video_id", ids),
      client.from("youtube_video_genres").select("youtube_video_id, genres(name)").in("youtube_video_id", ids),
      client.from("youtube_video_platforms").select("youtube_video_id, platforms(name)").in("youtube_video_id", ids),
    ]);

    const sourceNameById = new Map(
      ((sourcesRows as { data?: Array<{ id: string; name: string }> } | null)?.data ?? []).map(
        (s) => [s.id, s.name]
      )
    );
    const addNames = (
      list: Array<{ youtube_video_id: string; games?: { name: string }; tags?: { name: string }; genres?: { name: string }; platforms?: { name: string } }>,
      key: "gameNames" | "tagNames" | "genreNames" | "platformNames",
      sub: "games" | "tags" | "genres" | "platforms"
    ) => {
      const byVideo = new Map<string, string[]>();
      for (const r of list ?? []) {
        const name = r[sub]?.name;
        if (!name) continue;
        const arr = byVideo.get(r.youtube_video_id) ?? [];
        arr.push(name);
        byVideo.set(r.youtube_video_id, arr);
      }
      return byVideo;
    };

    const gameNamesByVideo = addNames((yvg.data ?? []) as never[], "gameNames", "games");
    const tagNamesByVideo = addNames((yvt.data ?? []) as never[], "tagNames", "tags");
    const genreNamesByVideo = addNames((yvgen.data ?? []) as never[], "genreNames", "genres");
    const platformNamesByVideo = addNames((yvp.data ?? []) as never[], "platformNames", "platforms");

    return videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      published_at: v.published_at,
      is_news: v.is_news ?? true,
      sourceId: v.source_id,
      sourceName: sourceNameById.get(v.source_id) ?? "",
      url: v.url,
      gameNames: gameNamesByVideo.get(v.id) ?? [],
      tagNames: tagNamesByVideo.get(v.id) ?? [],
      genreNames: genreNamesByVideo.get(v.id) ?? [],
      platformNames: platformNamesByVideo.get(v.id) ?? [],
    }));
  },

  async getVideoById(id: string): Promise<VideoEditRow | null> {
    const client = getClient();
    const { data: video, error } = await client
      .from("youtube_videos")
      .select("id,title,description,published_at,url,source_id,is_news")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!video) return null;

    const [sourceRow, games, tags, genres, platforms] = await Promise.all([
      video.source_id
        ? client.from("sources").select("name").eq("id", video.source_id).maybeSingle()
        : Promise.resolve({ data: null }),
      client.from("youtube_video_games").select("game_id").eq("youtube_video_id", id),
      client.from("youtube_video_tags").select("tag_id").eq("youtube_video_id", id),
      client.from("youtube_video_genres").select("genre_id").eq("youtube_video_id", id),
      client.from("youtube_video_platforms").select("platform_id").eq("youtube_video_id", id),
    ]);

    return {
      id: video.id,
      title: video.title,
      description: video.description ?? null,
      published_at: video.published_at,
      url: video.url,
      sourceId: video.source_id ?? "",
      sourceName: (sourceRow.data as { name?: string } | null)?.name ?? "",
      is_news: video.is_news ?? true,
      gameIds: (games.data ?? []).map((r: { game_id: string }) => r.game_id),
      tagIds: (tags.data ?? []).map((r: { tag_id: string }) => r.tag_id),
      genreIds: (genres.data ?? []).map((r: { genre_id: string }) => r.genre_id),
      platformIds: (platforms.data ?? []).map((r: { platform_id: string }) => r.platform_id),
    };
  },

  async updateVideo(
    id: string,
    updates: Partial<{
      title: string;
      description: string | null;
      published_at: string;
      is_news: boolean;
    }>
  ): Promise<void> {
    const client = getClient();
    const body: Record<string, unknown> = {};
    if (updates.title !== undefined) body.title = updates.title.trim();
    if (updates.description !== undefined) body.description = updates.description?.trim() || null;
    if (updates.published_at !== undefined) body.published_at = updates.published_at;
    if (updates.is_news !== undefined) body.is_news = updates.is_news;
    if (Object.keys(body).length > 0) {
      const { error } = await client.from("youtube_videos").update(body).eq("id", id);
      if (error) throw new Error(error.message);
    }
  },

  async deleteVideo(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from("youtube_videos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async setVideoEntities(
    videoId: string,
    ids: { gameIds: string[]; tagIds: string[]; genreIds: string[]; platformIds: string[] }
  ): Promise<void> {
    const client = getClient();
    await client.from("youtube_video_games").delete().eq("youtube_video_id", videoId);
    await client.from("youtube_video_tags").delete().eq("youtube_video_id", videoId);
    await client.from("youtube_video_genres").delete().eq("youtube_video_id", videoId);
    await client.from("youtube_video_platforms").delete().eq("youtube_video_id", videoId);
    for (const gameId of ids.gameIds) {
      await client.from("youtube_video_games").upsert({ youtube_video_id: videoId, game_id: gameId }, { onConflict: "youtube_video_id,game_id" });
    }
    for (const tagId of ids.tagIds) {
      await client.from("youtube_video_tags").upsert({ youtube_video_id: videoId, tag_id: tagId }, { onConflict: "youtube_video_id,tag_id" });
    }
    for (const genreId of ids.genreIds) {
      await client.from("youtube_video_genres").upsert({ youtube_video_id: videoId, genre_id: genreId }, { onConflict: "youtube_video_id,genre_id" });
    }
    for (const platformId of ids.platformIds) {
      await client.from("youtube_video_platforms").upsert({ youtube_video_id: videoId, platform_id: platformId }, { onConflict: "youtube_video_id,platform_id" });
    }
  },
};
