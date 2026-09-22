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
 * Usa substring para capturar termos no título; evita match de 1-2 chars sozinhos.
 */
function textContainsTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalizeForMatch(term);
  if (normalizedTerm.length < 2) return false;
  return normalizedText.includes(normalizedTerm);
}

/**
 * A partir de título + descrição (ex.: excerpt ou content slice), encontra ids de
 * subjects, tags e types que aparecem no texto (match por name ou slug).
 * Só retorna entidades existentes no catálogo; ordem: subjects primeiro (mais específicos), depois tags, types.
 */
export function extractEntityIdsFromText(
  title: string,
  description: string,
  catalog: EnrichmentCatalog
): EntityIds {
  const combined = `${title} ${description}`.slice(0, 2000);
  const normalized = normalizeForMatch(combined);

  const subjectIds: string[] = [];
  const tagIds: string[] = [];
  const typeIds: string[] = [];

  for (const s of catalog.subjects) {
    if (textContainsTerm(normalized, s.name) || textContainsTerm(normalized, s.slug)) {
      subjectIds.push(s.id);
    }
  }
  for (const t of catalog.tags) {
    if (textContainsTerm(normalized, t.name) || textContainsTerm(normalized, t.slug)) {
      tagIds.push(t.id);
    }
  }
  for (const typ of catalog.types) {
    if (textContainsTerm(normalized, typ.name) || textContainsTerm(normalized, typ.slug)) {
      typeIds.push(typ.id);
    }
  }

  return { subjectIds, tagIds, typeIds };
}
