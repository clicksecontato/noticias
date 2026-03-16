import type { TopGamesPayload } from "../types";

export interface GameCountRow {
  game_id: string;
  game_name: string;
  articles: number;
  videos: number;
  total: number;
}

export function generateTopGamesReport(
  gameCounts: GameCountRow[],
  options: { limit?: number } = {}
): TopGamesPayload {
  const limit = options.limit ?? 20;
  const items = gameCounts.slice(0, limit);
  return { items };
}
