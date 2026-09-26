export interface CoverageHit {
  subject_id: string;
  subject_name: string;
  source_id: string;
  source_name: string;
  provider: "rss" | "youtube";
  count: number;
}

export interface PerspectivasSource {
  source_id: string;
  source_name: string;
  provider: "rss" | "youtube";
  count: number;
}

export interface PerspectivasSubject {
  subject_id: string;
  subject_name: string;
  sources_total: number;
  videos: number;
  articles: number;
  sources: PerspectivasSource[];
}

export interface PerspectivasPayload {
  period: { start: string; end: string };
  subjects: PerspectivasSubject[];
}

export interface PortugueseVideoInput {
  id: string;
  source_id: string;
  language: string | null;
}

export interface PortugueseSubjectLink {
  video_id: string;
  subject_id: string;
  subject_name: string;
}

export interface EmPortuguesPayload {
  videos_total: number;
  portuguese_total: number;
  pct_portuguese: number;
  channels: Array<{ source_id: string; source_name: string; portuguese: number }>;
  subjects: Array<{ subject_id: string; subject_name: string; videos: number }>;
}

export interface TypeCountInput {
  type_id: string;
  type_name: string;
  articles: number;
  videos: number;
}

export interface ByTypesPayload {
  items: Array<TypeCountInput & { total: number }>;
}

function isPortuguese(language: string | null | undefined): boolean {
  return (language ?? "").trim().toLowerCase().startsWith("pt");
}

/** Assuntos tratados por pelo menos duas fontes independentes. */
export function buildPerspectivasPayload(
  hits: CoverageHit[],
  period: { periodStart: string; periodEnd: string }
): PerspectivasPayload {
  const bySubject = new Map<string, PerspectivasSubject>();
  for (const hit of hits) {
    if (hit.count <= 0) continue;
    const current = bySubject.get(hit.subject_id) ?? {
      subject_id: hit.subject_id,
      subject_name: hit.subject_name,
      sources_total: 0,
      videos: 0,
      articles: 0,
      sources: [],
    };
    current.sources.push({
      source_id: hit.source_id,
      source_name: hit.source_name,
      provider: hit.provider,
      count: hit.count,
    });
    if (hit.provider === "youtube") current.videos += hit.count;
    else current.articles += hit.count;
    bySubject.set(hit.subject_id, current);
  }

  const subjects = [...bySubject.values()]
    .map((subject) => {
      const sources = [...subject.sources].sort(
        (a, b) => b.count - a.count || a.source_name.localeCompare(b.source_name, "pt")
      );
      return { ...subject, sources, sources_total: sources.length };
    })
    .filter((subject) => subject.sources_total >= 2)
    .sort(
      (a, b) =>
        b.sources_total - a.sources_total ||
        b.videos - a.videos ||
        a.subject_name.localeCompare(b.subject_name, "pt")
    )
    .slice(0, 12);

  return {
    period: { start: period.periodStart, end: period.periodEnd },
    subjects,
  };
}

/** Vídeos cujo áudio está em português, por canal e por assunto. */
export function buildEmPortuguesPayload(input: {
  videos: PortugueseVideoInput[];
  subjects: PortugueseSubjectLink[];
  sourceNames: Map<string, string>;
}): EmPortuguesPayload {
  const portugueseIds = new Set<string>();
  const byChannel = new Map<string, number>();
  for (const video of input.videos) {
    if (!isPortuguese(video.language)) continue;
    portugueseIds.add(video.id);
    if (video.source_id) byChannel.set(video.source_id, (byChannel.get(video.source_id) ?? 0) + 1);
  }

  const bySubject = new Map<string, { subject_name: string; videos: number }>();
  for (const link of input.subjects) {
    if (!portugueseIds.has(link.video_id)) continue;
    const current = bySubject.get(link.subject_id) ?? { subject_name: link.subject_name, videos: 0 };
    current.videos += 1;
    bySubject.set(link.subject_id, current);
  }

  const channels = [...byChannel.entries()]
    .map(([source_id, portuguese]) => ({
      source_id,
      source_name: input.sourceNames.get(source_id) ?? source_id,
      portuguese,
    }))
    .sort((a, b) => b.portuguese - a.portuguese || a.source_name.localeCompare(b.source_name, "pt"));

  const subjects = [...bySubject.entries()]
    .map(([subject_id, row]) => ({ subject_id, subject_name: row.subject_name, videos: row.videos }))
    .sort((a, b) => b.videos - a.videos || a.subject_name.localeCompare(b.subject_name, "pt"))
    .slice(0, 12);

  const videosTotal = input.videos.length;
  const portugueseTotal = portugueseIds.size;
  return {
    videos_total: videosTotal,
    portuguese_total: portugueseTotal,
    pct_portuguese: videosTotal > 0 ? Math.round((portugueseTotal / videosTotal) * 100) : 0,
    channels,
    subjects,
  };
}

/** Tipos editoriais, com o volume de vídeos na frente. */
export function buildByTypesPayload(rows: TypeCountInput[]): ByTypesPayload {
  const items = rows
    .map((row) => ({ ...row, total: row.articles + row.videos }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.videos - a.videos || b.total - a.total || a.type_name.localeCompare(b.type_name, "pt"))
    .slice(0, 20);
  return { items };
}
