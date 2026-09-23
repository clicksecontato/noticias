/** Filtros de listagem editorial (funções puras). */

export type PautaFilter = "all" | "in" | "out";

/** Query `pauta`: 1|true|in → na pauta; 0|false|out → fora; vazio → todos. */
export function parsePautaFilter(raw: string | null | undefined): PautaFilter {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "in" || v === "sim") return "in";
  if (v === "0" || v === "false" || v === "out" || v === "nao" || v === "não")
    return "out";
  return "all";
}

export function pautaFilterToIsNews(
  filter: PautaFilter
): boolean | undefined {
  if (filter === "in") return true;
  if (filter === "out") return false;
  return undefined;
}

/** Query `semAssunto`: 1|true → só itens sem assunto vinculado. */
export function parseWithoutSubject(
  raw: string | null | undefined
): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "sim";
}
