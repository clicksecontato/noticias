/** Seleção de fontes para ingestão manual (funções puras). */

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
