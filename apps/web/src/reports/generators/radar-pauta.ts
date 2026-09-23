export type SubjectCountRow = {
  subject_id: string;
  subject_name: string;
  articles: number;
  videos: number;
  total: number;
};

export type RadarPautaTrend = "up" | "down" | "new" | "stable";

export type RadarPautaItem = {
  subject_id: string;
  subject_name: string;
  articles: number;
  videos: number;
  total: number;
  previous_total: number;
  delta: number;
  delta_pct: number | null;
  trend: RadarPautaTrend;
  rank: number;
  previous_rank: number | null;
};

export type RadarPautaPayload = {
  period: { start: string; end: string };
  previous_period: { start: string; end: string };
  items: RadarPautaItem[];
};

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInclusive(start: string, end: string): number {
  const ms = parseYMD(end).getTime() - parseYMD(start).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

/** Janela imediatamente anterior com a mesma duração (dias inclusivos). */
export function computePreviousPeriod(
  periodStart: string,
  periodEnd: string
): { periodStart: string; periodEnd: string } {
  const length = daysInclusive(periodStart, periodEnd);
  const prevEnd = new Date(parseYMD(periodStart).getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - (length - 1) * 86_400_000);
  return {
    periodStart: formatYMD(prevStart),
    periodEnd: formatYMD(prevEnd),
  };
}

function trendFor(delta: number, previousTotal: number): RadarPautaTrend {
  if (previousTotal === 0) return "new";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "stable";
}

export function generateRadarPautaReport(
  current: SubjectCountRow[],
  previous: SubjectCountRow[],
  options: { periodStart: string; periodEnd: string; limit?: number }
): RadarPautaPayload {
  const limit = options.limit ?? 20;
  const previousPeriod = computePreviousPeriod(
    options.periodStart,
    options.periodEnd
  );

  const prevById = new Map(previous.map((row) => [row.subject_id, row]));
  const previousRank = new Map(
    [...previous]
      .sort((a, b) => b.total - a.total || a.subject_name.localeCompare(b.subject_name))
      .map((row, index) => [row.subject_id, index + 1])
  );

  const sorted = [...current].sort(
    (a, b) => b.total - a.total || a.subject_name.localeCompare(b.subject_name)
  );

  const items: RadarPautaItem[] = sorted.slice(0, limit).map((row, index) => {
    const prev = prevById.get(row.subject_id);
    const previousTotal = prev?.total ?? 0;
    const delta = row.total - previousTotal;
    const deltaPct =
      previousTotal === 0
        ? null
        : Math.round((delta / previousTotal) * 1000) / 10;

    return {
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      articles: row.articles,
      videos: row.videos,
      total: row.total,
      previous_total: previousTotal,
      delta,
      delta_pct: deltaPct,
      trend: trendFor(delta, previousTotal),
      rank: index + 1,
      previous_rank: previousRank.get(row.subject_id) ?? null,
    };
  });

  return {
    period: { start: options.periodStart, end: options.periodEnd },
    previous_period: {
      start: previousPeriod.periodStart,
      end: previousPeriod.periodEnd,
    },
    items,
  };
}
