import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";
import {
  buildByTypesPayload,
  buildEmPortuguesPayload,
  buildPerspectivasPayload,
  type CoverageHit,
  type TypeCountInput,
} from "./generators/editorial-pautas";

const BATCH = 200;

function client() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado para pautas editoriais");
  return createClient(url, key);
}

function startIso(date: string): string {
  return date.length === 10 ? `${date}T00:00:00.000Z` : date;
}

function endExclusive(date: string): string {
  const day = date.slice(0, 10);
  const next = new Date(`${day}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

async function inBatches<T>(ids: string[], load: (batch: string[]) => Promise<T[]>): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += BATCH) {
    rows.push(...(await load(ids.slice(index, index + BATCH))));
  }
  return rows;
}

async function loadPeriod(periodStart: string, periodEnd: string) {
  const db = client();
  const start = startIso(periodStart);
  const end = endExclusive(periodEnd);
  const [articlesResult, videosResult, sourcesResult] = await Promise.all([
    db.from("articles").select("id").eq("is_news", true).gte("published_at", start).lt("published_at", end),
    db
      .from("youtube_videos")
      .select("id, source_id, default_audio_language")
      .eq("is_news", true)
      .gte("published_at", start)
      .lt("published_at", end),
    db.from("sources").select("id, name, provider"),
  ]);
  if (articlesResult.error) throw new Error(`Falha ao carregar notícias: ${articlesResult.error.message}`);
  if (videosResult.error) throw new Error(`Falha ao carregar vídeos: ${videosResult.error.message}`);
  if (sourcesResult.error) throw new Error(`Falha ao carregar fontes: ${sourcesResult.error.message}`);

  const sources = new Map(
    ((sourcesResult.data ?? []) as Array<{ id: string; name: string | null; provider: string | null }>).map(
      (source) => [source.id, { name: source.name ?? source.id, provider: source.provider }]
    )
  );
  return {
    db,
    articleIds: ((articlesResult.data ?? []) as Array<{ id: string }>).map((row) => row.id),
    videos: (videosResult.data ?? []) as Array<{
      id: string;
      source_id: string | null;
      default_audio_language: string | null;
    }>,
    sources,
  };
}

export async function loadPerspectivasPayload(periodStart: string, periodEnd: string) {
  const { db, articleIds, videos, sources } = await loadPeriod(periodStart, periodEnd);
  const articleSubjects = await inBatches(articleIds, async (batch) => {
    const { data, error } = await db.from("article_subjects").select("article_id, subject_id").in("article_id", batch);
    if (error) throw new Error(`Falha ao carregar assuntos das notícias: ${error.message}`);
    return (data ?? []) as Array<{ article_id: string; subject_id: string }>;
  });
  const articleSources = await inBatches(articleIds, async (batch) => {
    const { data, error } = await db.from("article_sources").select("article_id, source_id").in("article_id", batch);
    if (error) throw new Error(`Falha ao carregar fontes das notícias: ${error.message}`);
    return (data ?? []) as Array<{ article_id: string; source_id: string }>;
  });
  const videoIds = videos.map((video) => video.id);
  const videoSubjects = await inBatches(videoIds, async (batch) => {
    const { data, error } = await db
      .from("youtube_video_subjects")
      .select("youtube_video_id, subject_id")
      .in("youtube_video_id", batch);
    if (error) throw new Error(`Falha ao carregar assuntos dos vídeos: ${error.message}`);
    return (data ?? []) as Array<{ youtube_video_id: string; subject_id: string }>;
  });

  const sourcesByArticle = new Map<string, string[]>();
  for (const row of articleSources) {
    const list = sourcesByArticle.get(row.article_id) ?? [];
    list.push(row.source_id);
    sourcesByArticle.set(row.article_id, list);
  }
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const counts = new Map<string, CoverageHit>();

  function bump(
    subjectId: string,
    sourceId: string,
    provider: "rss" | "youtube"
  ) {
    const source = sources.get(sourceId);
    const key = `${subjectId}:${sourceId}`;
    const current = counts.get(key) ?? {
      subject_id: subjectId,
      subject_name: subjectId,
      source_id: sourceId,
      source_name: source?.name ?? sourceId,
      provider,
      count: 0,
    };
    current.count += 1;
    counts.set(key, current);
  }

  for (const link of articleSubjects) {
    for (const sourceId of sourcesByArticle.get(link.article_id) ?? []) {
      bump(link.subject_id, sourceId, "rss");
    }
  }
  for (const link of videoSubjects) {
    const sourceId = videoById.get(link.youtube_video_id)?.source_id;
    if (!sourceId) continue;
    bump(link.subject_id, sourceId, "youtube");
  }

  const subjectIds = [...new Set([...counts.values()].map((hit) => hit.subject_id))];
  if (subjectIds.length > 0) {
    const names = await inBatches(subjectIds, async (batch) => {
      const { data, error } = await db.from("subjects").select("id, name").in("id", batch);
      if (error) throw new Error(`Falha ao nomear assuntos: ${error.message}`);
      return (data ?? []) as Array<{ id: string; name: string | null }>;
    });
    const nameById = new Map(names.map((row) => [row.id, row.name ?? row.id]));
    for (const hit of counts.values()) {
      hit.subject_name = nameById.get(hit.subject_id) ?? hit.subject_name;
    }
  }

  return buildPerspectivasPayload([...counts.values()], { periodStart, periodEnd });
}

export async function loadEmPortuguesPayload(periodStart: string, periodEnd: string) {
  const { db, videos, sources } = await loadPeriod(periodStart, periodEnd);
  const videoIds = videos.map((video) => video.id);
  const links = await inBatches(videoIds, async (batch) => {
    const { data, error } = await db
      .from("youtube_video_subjects")
      .select("youtube_video_id, subject_id")
      .in("youtube_video_id", batch);
    if (error) throw new Error(`Falha ao carregar assuntos dos vídeos: ${error.message}`);
    return (data ?? []) as Array<{ youtube_video_id: string; subject_id: string }>;
  });
  const subjectIds = [...new Set(links.map((link) => link.subject_id))];
  const names = await inBatches(subjectIds, async (batch) => {
    const { data, error } = await db.from("subjects").select("id, name").in("id", batch);
    if (error) throw new Error(`Falha ao nomear assuntos: ${error.message}`);
    return (data ?? []) as Array<{ id: string; name: string | null }>;
  });
  const nameById = new Map(names.map((row) => [row.id, row.name ?? row.id]));
  return buildEmPortuguesPayload({
    videos: videos.map((video) => ({
      id: video.id,
      source_id: video.source_id ?? "",
      language: video.default_audio_language,
    })),
    subjects: links.map((link) => ({
      video_id: link.youtube_video_id,
      subject_id: link.subject_id,
      subject_name: nameById.get(link.subject_id) ?? link.subject_id,
    })),
    sourceNames: new Map([...sources.entries()].map(([id, source]) => [id, source.name])),
  });
}

export async function loadByTypesPayload(periodStart: string, periodEnd: string) {
  const { db, articleIds, videos } = await loadPeriod(periodStart, periodEnd);
  const articleLinks = await inBatches(articleIds, async (batch) => {
    const { data, error } = await db.from("article_types").select("type_id").in("article_id", batch);
    if (error) throw new Error(`Falha ao carregar tipos das notícias: ${error.message}`);
    return (data ?? []) as Array<{ type_id: string }>;
  });
  const videoLinks = await inBatches(
    videos.map((video) => video.id),
    async (batch) => {
      const { data, error } = await db.from("youtube_video_types").select("type_id").in("youtube_video_id", batch);
      if (error) throw new Error(`Falha ao carregar tipos dos vídeos: ${error.message}`);
      return (data ?? []) as Array<{ type_id: string }>;
    }
  );
  const counts = new Map<string, TypeCountInput>();
  function bump(typeId: string, field: "articles" | "videos") {
    const current = counts.get(typeId) ?? { type_id: typeId, type_name: typeId, articles: 0, videos: 0 };
    current[field] += 1;
    counts.set(typeId, current);
  }
  for (const link of articleLinks) bump(link.type_id, "articles");
  for (const link of videoLinks) bump(link.type_id, "videos");
  const typeIds = [...counts.keys()];
  if (typeIds.length > 0) {
    const names = await inBatches(typeIds, async (batch) => {
      const { data, error } = await db.from("types").select("id, name").in("id", batch);
      if (error) throw new Error(`Falha ao nomear tipos: ${error.message}`);
      return (data ?? []) as Array<{ id: string; name: string | null }>;
    });
    const nameById = new Map(names.map((row) => [row.id, row.name ?? row.id]));
    for (const row of counts.values()) row.type_name = nameById.get(row.type_id) ?? row.type_name;
  }
  return buildByTypesPayload([...counts.values()]);
}
