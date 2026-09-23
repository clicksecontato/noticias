/** Formata duração de ingestão para exibição (ex.: 1,2 s · 450 ms). */
export function formatIngestionDurationMs(durationMs: number | null | undefined): string {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs < 0) {
    return "—";
  }
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  const seconds = durationMs / 1000;
  return `${seconds.toLocaleString("pt-BR", {
    minimumFractionDigits: seconds < 10 ? 1 : 0,
    maximumFractionDigits: 1
  })} s`;
}
