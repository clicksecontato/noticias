/** Seleção de fontes para ingestão manual (funções puras). */

/** 24h — fontes sem ingestão nesse intervalo são “atrasadas”. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function toggleSourceId(selectedIds: string[], id: string): string[] {
  const set = new Set(selectedIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set];
}

export function selectAllSourceIds(availableIds: string[]): string[] {
  return [...new Set(availableIds.filter(Boolean))];
}

export function deselectAllSourceIds(): string[] {
  return [];
}

export function areAllSourcesSelected(
  selectedIds: string[],
  availableIds: string[]
): boolean {
  if (availableIds.length === 0) return false;
  const selected = new Set(selectedIds);
  return availableIds.every((id) => selected.has(id));
}

export function isSourceStale(
  lastIngestedAt: string | null | undefined,
  nowMs: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS
): boolean {
  if (!lastIngestedAt) return true;
  const t = Date.parse(lastIngestedAt);
  if (!Number.isFinite(t)) return true;
  return nowMs - t >= staleAfterMs;
}

export function selectStaleSourceIds(
  sources: Array<{ id: string; lastIngestedAt?: string | null }>,
  nowMs: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS
): string[] {
  return sources
    .filter((s) => isSourceStale(s.lastIngestedAt, nowMs, staleAfterMs))
    .map((s) => s.id);
}
