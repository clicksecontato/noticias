/** Converte duração ISO 8601 do YouTube (PT#H#M#S) em segundos. */
export function parseYoutubeDurationSeconds(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (!match[1] && !match[2] && !match[3]) return null;
  return hours * 3600 + minutes * 60 + seconds;
}
