import type { YoutubeFormatoPayload } from "./generators/youtube-formato";

export type VideoSliceParam =
  | "tagId"
  | "subjectId"
  | "creatorTag"
  | "topic"
  | "durationBand"
  | "language"
  | "broadcast"
  | "categoryId";

export interface MonthVideoChartRow {
  key: string;
  label: string;
  count: number;
}

export interface MonthVideoChartSlide {
  title: string;
  param: VideoSliceParam;
  rows: MonthVideoChartRow[];
}

interface NamedCount {
  id: string;
  name: string;
  count: number;
}

function namedRows(items: NamedCount[] | undefined): MonthVideoChartRow[] {
  return (items ?? [])
    .filter((item) => item.count > 0)
    .map((item) => ({ key: item.id, label: item.name, count: item.count }));
}

function countRows(
  items: Array<{ key: string; label: string; count: number }> | undefined
): MonthVideoChartRow[] {
  return (items ?? [])
    .filter((item) => item.count > 0)
    .map((item) => ({ key: item.key, label: item.label, count: item.count }));
}

/** Telas da apresentação mensal: tags, formato do YouTube, assuntos e tópicos. */
export function buildMonthVideoChartSlides(input: {
  formato?: YoutubeFormatoPayload | null;
  tags?: NamedCount[];
  subjects?: NamedCount[];
}): MonthVideoChartSlide[] {
  const slides: MonthVideoChartSlide[] = [];
  const tags = namedRows(input.tags);
  if (tags.length) slides.push({ title: "Tags", param: "tagId", rows: tags });

  const formato = input.formato;
  if (formato) {
    const duration = countRows(formato.duration_bands);
    if (duration.length) slides.push({ title: "Duração", param: "durationBand", rows: duration });
    const languages = countRows(formato.languages);
    if (languages.length) slides.push({ title: "Idioma do áudio", param: "language", rows: languages });
    const broadcast = countRows(formato.broadcast);
    if (broadcast.length) slides.push({ title: "Transmissão", param: "broadcast", rows: broadcast });
    const categories = formato.categories
      .filter((row) => row.count > 0)
      .map((row) => ({ key: row.category_id, label: row.label, count: row.count }));
    if (categories.length) {
      slides.push({ title: "Categoria YouTube", param: "categoryId", rows: categories });
    }
    const creatorTags = countRows(formato.creator_tags);
    if (creatorTags.length) {
      slides.push({ title: "Tags do criador", param: "creatorTag", rows: creatorTags });
    }
  }

  const subjects = namedRows(input.subjects);
  if (subjects.length) slides.push({ title: "Assuntos", param: "subjectId", rows: subjects });

  const topics = countRows(formato?.topics);
  if (topics.length) slides.push({ title: "Tópicos do YouTube", param: "topic", rows: topics });

  return slides;
}
