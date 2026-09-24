/**
 * Política de cota da YouTube Data API v3 (estimativa operacional).
 * Fonte clássica: https://developers.google.com/youtube/v3/determine_quota_cost
 * Reset diário: meia-noite Pacific Time. Console Google Cloud = fonte da verdade.
 */

export const YOUTUBE_API_DAILY_QUOTA_DEFAULT = 10_000;

export type YoutubeApiMethod =
  | "channels.list"
  | "playlistItems.list"
  | "search.list"
  | "videos.list"
  | "videos.insert";

export type YoutubeApiMethodMeta = {
  method: YoutubeApiMethod;
  units: number;
  /** Onde o produto usa este método (PT). */
  usedIn: string;
  auth: "api_key" | "oauth";
};

export const YOUTUBE_API_METHOD_CATALOG: readonly YoutubeApiMethodMeta[] = [
  {
    method: "channels.list",
    units: 1,
    usedIn: "Resolver @handle → canal; avatar do canal",
    auth: "api_key",
  },
  {
    method: "playlistItems.list",
    units: 1,
    usedIn: "Ingestão de vídeos (uploads do canal)",
    auth: "api_key",
  },
  {
    method: "search.list",
    units: 100,
    usedIn: "Fallback ao resolver handle (só se forHandle falhar)",
    auth: "api_key",
  },
  {
    method: "videos.list",
    units: 1,
    usedIn: "Metadados do vídeo de origem (shorts)",
    auth: "api_key",
  },
  {
    method: "videos.insert",
    units: 1600,
    usedIn: "Upload de short no canal destino (OAuth)",
    auth: "oauth",
  },
] as const;

const UNITS_BY_METHOD: Record<YoutubeApiMethod, number> = Object.fromEntries(
  YOUTUBE_API_METHOD_CATALOG.map((m) => [m.method, m.units])
) as Record<YoutubeApiMethod, number>;

export function getYoutubeApiMethodUnits(method: YoutubeApiMethod): number {
  return UNITS_BY_METHOD[method];
}

export function getYoutubeApiDailyLimit(
  env: Record<string, string | undefined> = process.env
): number {
  const raw = Number.parseInt(env.YOUTUBE_API_DAILY_QUOTA_UNITS || "", 10);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return YOUTUBE_API_DAILY_QUOTA_DEFAULT;
}

/** Dia civil da cota YouTube (America/Los_Angeles → YYYY-MM-DD). */
export function youtubeQuotaDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Próximo reset (meia-noite PT) em ISO. */
export function youtubeQuotaResetAtIso(now: Date = new Date()): string {
  const day = youtubeQuotaDayKey(now);
  // Meia-noite PT do dia seguinte: aproximação via offset dinâmico
  const probe = new Date(`${day}T12:00:00.000Z`);
  const ptParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(probe);
  const tzName = ptParts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-7";
  const match = tzName.match(/GMT([+-]\d+)/);
  const offsetHours = match ? Number(match[1]) : -7;
  // Início do dia PT = day 00:00 PT = day 00:00 - offset em UTC
  // offsetHours is e.g. -7 meaning UTC = local - (-7) = local+7
  const [y, m, d] = day.split("-").map(Number);
  const startUtcMs = Date.UTC(y, m - 1, d, -offsetHours, 0, 0);
  const nextReset = new Date(startUtcMs + 24 * 60 * 60 * 1000);
  return nextReset.toISOString();
}

export type YoutubeQuotaEventInput = {
  method: string;
  units: number;
  context?: string | null;
};

export type YoutubeQuotaMethodBreakdown = {
  method: YoutubeApiMethod;
  unitsPerCall: number;
  calls: number;
  units: number;
  usedIn: string;
  auth: "api_key" | "oauth";
};

export type YoutubeQuotaSummary = {
  quotaDay: string;
  dailyLimit: number;
  unitsUsed: number;
  unitsRemaining: number;
  percentUsed: number;
  resetAt: string;
  byMethod: YoutubeQuotaMethodBreakdown[];
};

export function buildYoutubeQuotaSummary(input: {
  dailyLimit: number;
  quotaDay: string;
  events: YoutubeQuotaEventInput[];
  now?: Date;
}): YoutubeQuotaSummary {
  const callsByMethod = new Map<string, { calls: number; units: number }>();
  let unitsUsed = 0;
  for (const ev of input.events) {
    unitsUsed += ev.units;
    const cur = callsByMethod.get(ev.method) ?? { calls: 0, units: 0 };
    cur.calls += 1;
    cur.units += ev.units;
    callsByMethod.set(ev.method, cur);
  }

  const byMethod: YoutubeQuotaMethodBreakdown[] = YOUTUBE_API_METHOD_CATALOG.map(
    (meta) => {
      const agg = callsByMethod.get(meta.method) ?? { calls: 0, units: 0 };
      return {
        method: meta.method,
        unitsPerCall: meta.units,
        calls: agg.calls,
        units: agg.units,
        usedIn: meta.usedIn,
        auth: meta.auth,
      };
    }
  );

  const unitsRemaining = Math.max(0, input.dailyLimit - unitsUsed);
  const percentUsed =
    input.dailyLimit > 0
      ? Math.min(100, Math.round((unitsUsed / input.dailyLimit) * 1000) / 10)
      : 0;

  return {
    quotaDay: input.quotaDay,
    dailyLimit: input.dailyLimit,
    unitsUsed,
    unitsRemaining,
    percentUsed,
    resetAt: youtubeQuotaResetAtIso(input.now ?? new Date()),
    byMethod,
  };
}
