import { isSourceStale, STALE_AFTER_MS } from "./source-selection";

export interface SourceStatusInput {
  id: string;
  name: string;
  provider?: "rss" | "youtube";
  lastIngestedAt?: string | null;
}

export interface SourceHealthSlice {
  key: "ok" | "stale";
  label: string;
  value: number;
  color: string;
}

export interface SourceFreshnessBar {
  id: string;
  name: string;
  /** Horas desde a última ingestão (nunca = staleAfterMs em horas). */
  hoursAgo: number;
  stale: boolean;
  provider: "rss" | "youtube";
}

const GOLD = "#d4a574";
const STALE = "#c4784a";

/** Fatias do donut: Ok vs Atrasada. */
export function buildSourceHealthSlices(
  sources: SourceStatusInput[],
  nowMs: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS
): SourceHealthSlice[] {
  let ok = 0;
  let stale = 0;
  for (const s of sources) {
    if (isSourceStale(s.lastIngestedAt, nowMs, staleAfterMs)) stale += 1;
    else ok += 1;
  }
  return [
    { key: "ok", label: "Em dia", value: ok, color: GOLD },
    { key: "stale", label: "Atrasada", value: stale, color: STALE },
  ].filter((s) => s.value > 0);
}

/** Barras de frescor (horas desde última ingestão), mais antigas primeiro. */
export function buildSourceFreshnessBars(
  sources: SourceStatusInput[],
  nowMs: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS
): SourceFreshnessBar[] {
  const maxHours = Math.max(1, Math.round(staleAfterMs / (60 * 60 * 1000)));
  return sources
    .map((s) => {
      const stale = isSourceStale(s.lastIngestedAt, nowMs, staleAfterMs);
      let hoursAgo = maxHours;
      if (s.lastIngestedAt) {
        const t = Date.parse(s.lastIngestedAt);
        if (Number.isFinite(t)) {
          hoursAgo = Math.max(0, Math.round((nowMs - t) / (60 * 60 * 1000)));
        }
      }
      return {
        id: s.id,
        name: s.name,
        hoursAgo,
        stale,
        provider: s.provider === "youtube" ? "youtube" : "rss",
      };
    })
    .sort((a, b) => b.hoursAgo - a.hoursAgo);
}
