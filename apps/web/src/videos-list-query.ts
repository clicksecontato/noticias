/** Query string da listagem pública /videos. */

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export type VideosPeriodPreset = "" | "today" | "7d" | "30d" | "90d";

export interface VideosListParams {
  page: number;
  sourceIds: string[];
  dateFrom: string;
  dateTo: string;
  period: VideosPeriodPreset;
}

export interface BuildVideosQueryInput extends VideosListParams {
  basePath?: string;
}

function isYmd(value: string): boolean {
  if (!YMD_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(t);
}

function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PERIOD_VALUES = new Set<VideosPeriodPreset>(["today", "7d", "30d", "90d"]);

/** Parseia `source=a,b,c` (ou valor único) em lista estável sem duplicatas. */
export function parseSourceIdsParam(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Alterna um canal na seleção (clique adiciona / remove). */
export function toggleSourceId(current: string[], id: string): string[] {
  const trimmed = id.trim();
  if (!trimmed) return [];
  if (current.includes(trimmed)) {
    return current.filter((x) => x !== trimmed);
  }
  return [...current, trimmed];
}

export function parseVideosListParams(searchParams: {
  page?: string;
  source?: string;
  from?: string;
  to?: string;
  period?: string;
}): VideosListParams {
  const pageParam = Number.parseInt(searchParams.page || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const sourceIds = parseSourceIdsParam(searchParams.source);
  const rawFrom = (searchParams.from || "").trim();
  const rawTo = (searchParams.to || "").trim();
  const rawPeriod = (searchParams.period || "").trim() as VideosPeriodPreset;
  const period: VideosPeriodPreset = PERIOD_VALUES.has(rawPeriod)
    ? rawPeriod
    : "";

  return {
    page,
    sourceIds,
    dateFrom: isYmd(rawFrom) ? rawFrom : "",
    dateTo: isYmd(rawTo) ? rawTo : "",
    period,
  };
}

/** Converte preset em intervalo inclusivo (UTC calendar). */
export function datesForPeriodPreset(
  period: VideosPeriodPreset,
  now: Date = new Date()
): { dateFrom: string; dateTo: string } {
  if (!period) return { dateFrom: "", dateTo: "" };
  const days =
    period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { dateFrom: formatYmdUtc(start), dateTo: formatYmdUtc(end) };
}

/** Resolve from/to efetivos: preset tem prioridade sobre datas manuais. */
export function resolveVideosDateRange(
  params: Pick<VideosListParams, "period" | "dateFrom" | "dateTo">,
  now: Date = new Date()
): { dateFrom?: string; dateTo?: string } {
  if (params.period) {
    const { dateFrom, dateTo } = datesForPeriodPreset(params.period, now);
    return {
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };
  }
  return {
    ...(params.dateFrom && { dateFrom: params.dateFrom }),
    ...(params.dateTo && { dateTo: params.dateTo }),
  };
}

export function buildVideosQueryPath(input: BuildVideosQueryInput): string {
  const basePath = input.basePath ?? "/videos";
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  if (input.sourceIds.length > 0) {
    params.set("source", input.sourceIds.join(","));
  }
  if (input.period) {
    params.set("period", input.period);
  } else {
    if (input.dateFrom) params.set("from", input.dateFrom);
    if (input.dateTo) params.set("to", input.dateTo);
  }
  return `${basePath}?${params.toString()}`;
}

/** Fim exclusivo do dia (UTC) para filtro `published_at < end`. */
export function dateToEndExclusive(dateTo: string): string {
  const d = new Date(`${dateTo}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
