import { formatYoutubeCategory } from "../../admin/youtube-video-labels";

export interface YoutubeFormatoVideoInput {
  durationSeconds: number | null;
  defaultAudioLanguage: string | null;
  liveBroadcastContent: string | null;
  hasCaptions: boolean | null;
  creatorTags: string[];
  topicCategories: string[];
  youtubeCategoryId: string | null;
}

export interface YoutubeFormatoCount {
  key: string;
  label: string;
  count: number;
}

export interface YoutubeFormatoPayload {
  videos_total: number;
  hours_total: number;
  pct_portuguese: number;
  pct_captions: number;
  duration_bands: Array<YoutubeFormatoCount & { hours: number }>;
  languages: YoutubeFormatoCount[];
  broadcast: YoutubeFormatoCount[];
  captions: { yes: number; no: number; unknown: number };
  creator_tags: YoutubeFormatoCount[];
  topics: YoutubeFormatoCount[];
  categories: Array<{ category_id: string; label: string; count: number }>;
}

const DURATION_BANDS = [
  { key: "short", label: "Até 1 min" },
  { key: "medium", label: "Até 20 min" },
  { key: "long", label: "Acima de 20 min" },
  { key: "unknown", label: "Sem duração" },
] as const;

function durationBand(seconds: number | null): (typeof DURATION_BANDS)[number]["key"] {
  if (seconds == null || seconds < 0) return "unknown";
  if (seconds <= 60) return "short";
  if (seconds <= 20 * 60) return "medium";
  return "long";
}

function languageBucket(code: string | null): "pt" | "en" | "other" | "unknown" {
  if (!code?.trim()) return "unknown";
  const normalized = code.trim().toLowerCase();
  if (normalized.startsWith("pt")) return "pt";
  if (normalized.startsWith("en")) return "en";
  return "other";
}

function broadcastBucket(value: string | null): "none" | "live" | "upcoming" | "unknown" {
  if (value === "none" || value === "live" || value === "upcoming") return value;
  return "unknown";
}

export function topicCategoryLabel(url: string): string {
  const slug = url.split("/").filter(Boolean).pop() ?? url;
  try {
    return decodeURIComponent(slug).replaceAll("_", " ");
  } catch {
    return slug.replaceAll("_", " ");
  }
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function topCounts(counts: Map<string, number>, limit: number): YoutubeFormatoCount[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ key: label, label, count }));
}

/** Formato do YouTube no período: duração, idioma, transmissão, legenda, tags e tópicos. */
export function generateYoutubeFormatoReport(
  videos: YoutubeFormatoVideoInput[]
): YoutubeFormatoPayload {
  const bandCounts = new Map<string, { count: number; seconds: number }>();
  for (const band of DURATION_BANDS) bandCounts.set(band.key, { count: 0, seconds: 0 });
  const languages = new Map<string, number>([
    ["pt", 0],
    ["en", 0],
    ["other", 0],
    ["unknown", 0],
  ]);
  const broadcast = new Map<string, number>([
    ["none", 0],
    ["live", 0],
    ["upcoming", 0],
    ["unknown", 0],
  ]);
  const captions = { yes: 0, no: 0, unknown: 0 };
  const creatorTags = new Map<string, number>();
  const topics = new Map<string, number>();
  const categories = new Map<string, number>();
  let secondsTotal = 0;

  for (const video of videos) {
    const band = durationBand(video.durationSeconds);
    const bucket = bandCounts.get(band)!;
    bucket.count += 1;
    if (video.durationSeconds != null && video.durationSeconds > 0) {
      bucket.seconds += video.durationSeconds;
      secondsTotal += video.durationSeconds;
    }
    languages.set(languageBucket(video.defaultAudioLanguage), (languages.get(languageBucket(video.defaultAudioLanguage)) ?? 0) + 1);
    const live = broadcastBucket(video.liveBroadcastContent);
    broadcast.set(live, (broadcast.get(live) ?? 0) + 1);
    if (video.hasCaptions === true) captions.yes += 1;
    else if (video.hasCaptions === false) captions.no += 1;
    else captions.unknown += 1;
    for (const tag of video.creatorTags) {
      const label = tag.trim();
      if (!label) continue;
      creatorTags.set(label, (creatorTags.get(label) ?? 0) + 1);
    }
    for (const topic of video.topicCategories) {
      const label = topicCategoryLabel(topic);
      if (!label) continue;
      topics.set(label, (topics.get(label) ?? 0) + 1);
    }
    if (video.youtubeCategoryId) {
      categories.set(video.youtubeCategoryId, (categories.get(video.youtubeCategoryId) ?? 0) + 1);
    }
  }

  const languageLabels: Record<string, string> = {
    pt: "Português",
    en: "Inglês",
    other: "Outros",
    unknown: "Sem idioma",
  };
  const broadcastLabels: Record<string, string> = {
    none: "Gravado",
    live: "Ao vivo",
    upcoming: "Estreia",
    unknown: "Sem informação",
  };

  return {
    videos_total: videos.length,
    hours_total: Math.round((secondsTotal / 3600) * 10) / 10,
    pct_portuguese: pct(languages.get("pt") ?? 0, videos.length),
    pct_captions: pct(captions.yes, videos.length),
    duration_bands: DURATION_BANDS.map((band) => {
      const row = bandCounts.get(band.key)!;
      return {
        key: band.key,
        label: band.label,
        count: row.count,
        hours: Math.round((row.seconds / 3600) * 10) / 10,
      };
    }),
    languages: [...languages.entries()].map(([key, count]) => ({
      key,
      label: languageLabels[key] ?? key,
      count,
    })),
    broadcast: [...broadcast.entries()].map(([key, count]) => ({
      key,
      label: broadcastLabels[key] ?? key,
      count,
    })),
    captions,
    creator_tags: topCounts(creatorTags, 15),
    topics: topCounts(topics, 10),
    categories: [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category_id, count]) => ({
        category_id,
        label: formatYoutubeCategory(category_id),
        count,
      })),
  };
}
