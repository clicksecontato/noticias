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
  sourceImageUrl: string | null;
  url: string;
  subjectNames: string[];
  tagNames: string[];
  typeNames: string[];
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
  subjectIds: string[];
  tagIds: string[];
  typeIds: string[];
}

export interface SourceOption {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface ListVideosFilters {
  limit?: number;
  offset?: number;
  sourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  isNews?: boolean;
  withoutSubject?: boolean;
}

export const videosRepository = {
  async listSources(): Promise<SourceOption[]> {
    const { data, error } = await getClient()
      .from("sources")
      .select("id,name,image_url")
      .eq("is_active", true)
      .eq("provider", "youtube")
      .order("name");
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<{ id: string; name: string; image_url: string | null }>).map(
      (s) => ({
        id: s.id,
        name: s.name,
        imageUrl: s.image_url ?? null,
      })
    );
  },

  async countVideos(filters: ListVideosFilters = {}): Promise<number> {
    const client = getClient();
    const { sourceId, dateFrom, dateTo, isNews, withoutSubject } = filters;

    let query = client.from("youtube_videos").select("id", { count: "exact", head: true });
    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));
    if (sourceId) query = query.eq("source_id", sourceId);
    if (typeof isNews === "boolean") query = query.eq("is_news", isNews);

    if (withoutSubject) {
      const { data: linked, error: linkErr } = await client
        .from("youtube_video_subjects")
        .select("youtube_video_id");
      if (linkErr) throw new Error(linkErr.message);
      const withSubject = [
        ...new Set(
          (linked ?? []).map((r: { youtube_video_id: string }) => r.youtube_video_id)
        ),
      ];
      if (withSubject.length > 0) {
        query = query.not("id", "in", `(${withSubject.join(",")})`);
      }
    }

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
    const { sourceId, dateFrom, dateTo, isNews, withoutSubject } = filters;

    let query = client
      .from("youtube_videos")
      .select("id,title,description,published_at,url,source_id,is_news")
      .order("published_at", { ascending: false });

    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));
    if (sourceId) query = query.eq("source_id", sourceId);
    if (typeof isNews === "boolean") query = query.eq("is_news", isNews);

    if (withoutSubject) {
      const { data: linked, error: linkErr } = await client
        .from("youtube_video_subjects")
        .select("youtube_video_id");
      if (linkErr) throw new Error(linkErr.message);
      const withSubject = [
        ...new Set(
          (linked ?? []).map((r: { youtube_video_id: string }) => r.youtube_video_id)
        ),
      ];
      if (withSubject.length > 0) {
        query = query.not("id", "in", `(${withSubject.join(",")})`);
      }
    }

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
    const [sourcesRows, yvs, yvt, yvtype] = await Promise.all([
      client.from("sources").select("id,name,image_url"),
      client.from("youtube_video_subjects").select("youtube_video_id, subjects(name)").in("youtube_video_id", ids),
      client.from("youtube_video_tags").select("youtube_video_id, tags(name)").in("youtube_video_id", ids),
      client.from("youtube_video_types").select("youtube_video_id, types(name)").in("youtube_video_id", ids),
    ]);

    const sourceMetaById = new Map(
      (
        (sourcesRows as {
          data?: Array<{ id: string; name: string; image_url: string | null }>;
        } | null)?.data ?? []
      ).map((s) => [
        s.id,
        { name: s.name, imageUrl: s.image_url ?? null },
      ])
    );
    const addNames = (
      list: Array<{ youtube_video_id: string; subjects?: { name: string }; tags?: { name: string }; types?: { name: string } }>,
      sub: "subjects" | "tags" | "types"
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

    const subjectNamesByVideo = addNames((yvs.data ?? []) as never[], "subjects");
    const tagNamesByVideo = addNames((yvt.data ?? []) as never[], "tags");
    const typeNamesByVideo = addNames((yvtype.data ?? []) as never[], "types");

    return videos.map((v) => {
      const meta = sourceMetaById.get(v.source_id);
      return {
        id: v.id,
        title: v.title,
        description: v.description,
        published_at: v.published_at,
        is_news: v.is_news ?? true,
        sourceId: v.source_id,
        sourceName: meta?.name ?? "",
        sourceImageUrl: meta?.imageUrl ?? null,
        url: v.url,
        subjectNames: subjectNamesByVideo.get(v.id) ?? [],
        tagNames: tagNamesByVideo.get(v.id) ?? [],
        typeNames: typeNamesByVideo.get(v.id) ?? [],
      };
    });
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

    const [sourceRow, subjects, tags, types] = await Promise.all([
      video.source_id
        ? client.from("sources").select("name").eq("id", video.source_id).maybeSingle()
        : Promise.resolve({ data: null }),
      client.from("youtube_video_subjects").select("subject_id").eq("youtube_video_id", id),
      client.from("youtube_video_tags").select("tag_id").eq("youtube_video_id", id),
      client.from("youtube_video_types").select("type_id").eq("youtube_video_id", id),
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
      subjectIds: (subjects.data ?? []).map((r: { subject_id: string }) => r.subject_id),
      tagIds: (tags.data ?? []).map((r: { tag_id: string }) => r.tag_id),
      typeIds: (types.data ?? []).map((r: { type_id: string }) => r.type_id),
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
    ids: { subjectIds: string[]; tagIds: string[]; typeIds: string[] }
  ): Promise<void> {
    const client = getClient();
    await client.from("youtube_video_subjects").delete().eq("youtube_video_id", videoId);
    await client.from("youtube_video_tags").delete().eq("youtube_video_id", videoId);
    await client.from("youtube_video_types").delete().eq("youtube_video_id", videoId);
    for (const subjectId of ids.subjectIds) {
      await client.from("youtube_video_subjects").upsert({ youtube_video_id: videoId, subject_id: subjectId }, { onConflict: "youtube_video_id,subject_id" });
    }
    for (const tagId of ids.tagIds) {
      await client.from("youtube_video_tags").upsert({ youtube_video_id: videoId, tag_id: tagId }, { onConflict: "youtube_video_id,tag_id" });
    }
    for (const typeId of ids.typeIds) {
      await client.from("youtube_video_types").upsert({ youtube_video_id: videoId, type_id: typeId }, { onConflict: "youtube_video_id,type_id" });
    }
  },
};
