import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";
import { topicCategoryLabel } from "../reports/generators/youtube-formato";

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
  duration_seconds: number | null;
  live_broadcast_content: string | null;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
  sourceImageUrl: string | null;
  url: string;
  thumbnailUrl?: string | null;
  videoId?: string | null;
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
  durationSeconds: number | null;
  creatorTags: string[];
  liveBroadcastContent: string | null;
  defaultAudioLanguage: string | null;
  hasCaptions: boolean | null;
  topicCategories: string[];
  youtubeCategoryId: string | null;
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
  sourceIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  isNews?: boolean;
  withoutSubject?: boolean;
  tagId?: string;
  subjectId?: string;
  creatorTag?: string;
  topic?: string;
  durationBand?: string;
  language?: string;
  categoryId?: string;
  broadcast?: string;
}

type VideoFilterQuery = {
  gte: (column: string, value: string | number) => VideoFilterQuery;
  gt: (column: string, value: number) => VideoFilterQuery;
  lt: (column: string, value: string) => VideoFilterQuery;
  lte: (column: string, value: number) => VideoFilterQuery;
  eq: (column: string, value: string | boolean) => VideoFilterQuery;
  is: (column: string, value: null) => VideoFilterQuery;
  ilike: (column: string, value: string) => VideoFilterQuery;
  not: (column: string, operator: string, value: null | string) => VideoFilterQuery;
  contains: (column: string, value: string[]) => VideoFilterQuery;
  or: (filters: string) => VideoFilterQuery;
  in: (column: string, values: string[]) => VideoFilterQuery;
  order: (column: string, options: { ascending: boolean }) => VideoFilterQuery;
  range: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null; count?: number | null }>;
  select?: never;
};

function applyColumnFilters<T>(query: T, filters: ListVideosFilters): T {
  let next = query as VideoFilterQuery;
  const { sourceId, sourceIds, dateFrom, dateTo, isNews, creatorTag, durationBand, language, categoryId, broadcast } =
    filters;
  if (dateFrom) next = next.gte("published_at", dateFrom + "T00:00:00.000Z");
  if (dateTo) next = next.lt("published_at", dateToEndExclusive(dateTo));
  if (sourceIds && sourceIds.length > 0) next = next.in("source_id", sourceIds);
  else if (sourceId) next = next.eq("source_id", sourceId);
  if (typeof isNews === "boolean") next = next.eq("is_news", isNews);
  if (creatorTag) next = next.contains("creator_tags", [creatorTag]);
  if (categoryId) next = next.eq("youtube_category_id", categoryId);
  if (durationBand === "short") next = next.gte("duration_seconds", 0).lte("duration_seconds", 60);
  if (durationBand === "medium") next = next.gt("duration_seconds", 60).lte("duration_seconds", 20 * 60);
  if (durationBand === "long") next = next.gt("duration_seconds", 20 * 60);
  if (durationBand === "unknown") next = next.is("duration_seconds", null);
  if (language === "pt") next = next.ilike("default_audio_language", "pt%");
  if (language === "en") next = next.ilike("default_audio_language", "en%");
  if (language === "unknown") next = next.is("default_audio_language", null);
  if (language === "other") {
    next = next
      .not("default_audio_language", "is", null)
      .not("default_audio_language", "ilike", "pt%")
      .not("default_audio_language", "ilike", "en%");
  }
  if (broadcast === "none" || broadcast === "live" || broadcast === "upcoming") {
    next = next.eq("live_broadcast_content", broadcast);
  }
  if (broadcast === "unknown") {
    next = next.or("live_broadcast_content.is.null,live_broadcast_content.not.in.(none,live,upcoming)");
  }
  return next as T;
}

async function linkVideoIds(
  client: ReturnType<typeof getClient>,
  table: "youtube_video_tags" | "youtube_video_subjects",
  column: "tag_id" | "subject_id",
  id: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await client
      .from(table)
      .select("youtube_video_id")
      .eq(column, id)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as Array<{ youtube_video_id: string }>;
    for (const row of batch) ids.add(row.youtube_video_id);
    if (batch.length < 1000) break;
  }
  return ids;
}

async function resolveConstrainedIds(
  client: ReturnType<typeof getClient>,
  filters: ListVideosFilters
): Promise<string[] | undefined> {
  if (!filters.tagId && !filters.subjectId && !filters.topic) return undefined;
  const rows: Array<{ id: string; published_at: string; topic_categories?: string[] | null }> = [];
  for (let from = 0; from < 20000; from += 1000) {
    const query = applyColumnFilters(
      client
        .from("youtube_videos")
        .select("id,published_at,topic_categories")
        .order("published_at", { ascending: false }),
      filters
    );
    const { data, error } = await query.range(from, from + 999);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as unknown as typeof rows;
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  let matched = rows;
  if (filters.topic) {
    const label = filters.topic;
    matched = matched.filter((row) =>
      (row.topic_categories ?? []).some((url) => topicCategoryLabel(url) === label)
    );
  }
  let ids = matched.map((row) => row.id);
  if (filters.tagId) {
    const linked = await linkVideoIds(client, "youtube_video_tags", "tag_id", filters.tagId);
    ids = ids.filter((videoId) => linked.has(videoId));
  }
  if (filters.subjectId) {
    const linked = await linkVideoIds(client, "youtube_video_subjects", "subject_id", filters.subjectId);
    ids = ids.filter((videoId) => linked.has(videoId));
  }
  return ids;
}

async function topNamedLinks(
  client: ReturnType<typeof getClient>,
  table: "youtube_video_tags" | "youtube_video_subjects",
  fk: "tag_id" | "subject_id",
  nameTable: "tags" | "subjects",
  videoIds: string[],
  limit = 15
): Promise<Array<{ id: string; name: string; count: number }>> {
  if (!videoIds.length) return [];
  const counts = new Map<string, number>();
  for (let index = 0; index < videoIds.length; index += 100) {
    const batch = videoIds.slice(index, index + 100);
    const { data, error } = await client.from(table).select(fk).in("youtube_video_id", batch);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as Array<Record<string, string>>) {
      const id = row[fk];
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  if (!top.length) return [];
  const { data: names, error } = await client
    .from(nameTable)
    .select("id,name")
    .in(
      "id",
      top.map(([id]) => id)
    );
  if (error) throw new Error(error.message);
  const nameById = new Map(
    ((names ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])
  );
  return top.map(([id, count]) => ({ id, name: nameById.get(id) ?? id, count }));
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
    const constrained = await resolveConstrainedIds(client, filters);
    if (constrained && !filters.withoutSubject) return constrained.length;

    const { withoutSubject } = filters;

    let query = applyColumnFilters(
      client.from("youtube_videos").select("id", { count: "exact", head: true }),
      filters
    );
    if (constrained) {
      if (constrained.length === 0) return 0;
      query = query.in("id", constrained);
    }

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
    const { withoutSubject } = filters;
    const constrained = await resolveConstrainedIds(client, filters);

    let query = client
      .from("youtube_videos")
      .select(
        "id,video_id,title,thumbnail_url,description,published_at,url,source_id,is_news,duration_seconds,live_broadcast_content"
      )
      .order("published_at", { ascending: false });

    if (constrained) {
      const pageIds = constrained.slice(offset, offset + limit);
      if (pageIds.length === 0) return [];
      query = query.in("id", pageIds);
    } else {
      query = applyColumnFilters(query, filters);
    }

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

    const { data: rows, error } = constrained
      ? await query
      : await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    const videos = (rows ?? []) as Array<{
      id: string;
      video_id: string | null;
      title: string;
      thumbnail_url: string | null;
      description: string | null;
      published_at: string;
      url: string;
      source_id: string;
      is_news: boolean;
      duration_seconds: number | null;
      live_broadcast_content: string | null;
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
        duration_seconds: v.duration_seconds ?? null,
        live_broadcast_content: v.live_broadcast_content ?? null,
        is_news: v.is_news ?? true,
        sourceId: v.source_id,
        sourceName: meta?.name ?? "",
        sourceImageUrl: meta?.imageUrl ?? null,
        url: v.url,
        thumbnailUrl: v.thumbnail_url ?? null,
        videoId: v.video_id ?? null,
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
      .select(
        "id,title,description,published_at,url,source_id,is_news,duration_seconds,creator_tags,live_broadcast_content,default_audio_language,has_captions,topic_categories,youtube_category_id"
      )
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
      durationSeconds: video.duration_seconds ?? null,
      creatorTags: video.creator_tags ?? [],
      liveBroadcastContent: video.live_broadcast_content ?? null,
      defaultAudioLanguage: video.default_audio_language ?? null,
      hasCaptions: video.has_captions ?? null,
      topicCategories: video.topic_categories ?? [],
      youtubeCategoryId: video.youtube_category_id ?? null,
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

  async editorialGroups(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    tags: Array<{ id: string; name: string; count: number }>;
    subjects: Array<{ id: string; name: string; count: number }>;
  }> {
    const client = getClient();
    const ids: string[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const query = applyColumnFilters(
        client.from("youtube_videos").select("id").order("published_at", { ascending: false }),
        { dateFrom, dateTo, isNews: true }
      );
      const { data, error } = await query.range(from, from + 999);
      if (error) throw new Error(error.message);
      const batch = (data ?? []) as Array<{ id: string }>;
      ids.push(...batch.map((row) => row.id));
      if (batch.length < 1000) break;
    }
    const [tags, subjects] = await Promise.all([
      topNamedLinks(client, "youtube_video_tags", "tag_id", "tags", ids),
      topNamedLinks(client, "youtube_video_subjects", "subject_id", "subjects", ids),
    ]);
    return { tags, subjects };
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
