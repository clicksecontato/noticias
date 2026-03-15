import type { EnrichmentCatalog, EntityIds } from "./content-repository";

/**
 * Normaliza texto para match: minúsculas, remove acentos (NFD).
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Verifica se um termo (name ou slug) aparece no texto normalizado.
 * Usa substring para capturar "Elden Ring" no título; evita match de 1-2 chars sozinhos.
 */
function textContainsTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalizeForMatch(term);
  if (normalizedTerm.length < 2) return false;
  return normalizedText.includes(normalizedTerm);
}

/**
 * A partir de título + descrição (ex.: excerpt ou content slice), encontra ids de
 * games, tags, genres e platforms que aparecem no texto (match por name ou slug).
 * Só retorna entidades existentes no catálogo; ordem: games primeiro (mais específicos), depois tags, genres, platforms.
 */
export function extractEntityIdsFromText(
  title: string,
  description: string,
  catalog: EnrichmentCatalog
): EntityIds {
  const combined = `${title} ${description}`.slice(0, 2000);
  const normalized = normalizeForMatch(combined);

  const gameIds: string[] = [];
  const tagIds: string[] = [];
  const genreIds: string[] = [];
  const platformIds: string[] = [];

  for (const g of catalog.games) {
    if (textContainsTerm(normalized, g.name) || textContainsTerm(normalized, g.slug)) {
      gameIds.push(g.id);
    }
  }
  for (const t of catalog.tags) {
    if (textContainsTerm(normalized, t.name) || textContainsTerm(normalized, t.slug)) {
      tagIds.push(t.id);
    }
  }
  for (const g of catalog.genres) {
    if (textContainsTerm(normalized, g.name) || textContainsTerm(normalized, g.slug)) {
      genreIds.push(g.id);
    }
  }
  for (const p of catalog.platforms) {
    if (textContainsTerm(normalized, p.name) || textContainsTerm(normalized, p.slug)) {
      platformIds.push(p.id);
    }
  }

  return { gameIds, tagIds, genreIds, platformIds };
}
