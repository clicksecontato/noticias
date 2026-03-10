export interface WebRouteInput {
  type: "news" | "game" | "games-like" | "best-genre" | "best-genre-platform" | "hardware";
  slug?: string;
  genre?: string;
  platform?: string;
  ram?: string;
}

function requireParam(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("Missing required route parameter");
  }
  return value.trim();
}

export function buildRoutePath(input: WebRouteInput): string {
  if (input.type === "news") {
    return `/news/${requireParam(input.slug)}`;
  }

  if (input.type === "game") {
    return `/games/${requireParam(input.slug)}`;
  }

  if (input.type === "games-like") {
    return `/games-like/${requireParam(input.slug)}`;
  }

  if (input.type === "best-genre") {
    return `/best/${requireParam(input.genre)}`;
  }

  if (input.type === "best-genre-platform") {
    return `/best/${requireParam(input.genre)}/${requireParam(input.platform)}`;
  }

  return `/hardware/${requireParam(input.ram)}`;
}
