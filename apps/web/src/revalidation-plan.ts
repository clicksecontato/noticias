import {
  buildRevalidateTags,
  type RevalidateTagInput
} from "./publishing";

export interface PublicationEvent {
  entity: "news" | "game" | "genre-page" | "hardware-page";
  slug?: string;
  genre?: string;
  platform?: string;
  ram?: string;
}

export interface RevalidationPlan {
  tags: string[];
  paths: string[];
}

function toTagInput(event: PublicationEvent): RevalidateTagInput {
  if (event.entity === "news") {
    return { pageType: "news", slug: event.slug };
  }

  if (event.entity === "game") {
    return { pageType: "game", slug: event.slug, genre: event.genre };
  }

  if (event.entity === "genre-page") {
    return { pageType: "best", genre: event.genre, platform: event.platform };
  }

  return { pageType: "hardware", ram: event.ram };
}

function getPathList(event: PublicationEvent): string[] {
  if (event.entity === "news" && event.slug) {
    return [`/news/${event.slug}`];
  }

  if (event.entity === "game" && event.slug) {
    return [`/games/${event.slug}`, `/games-like/${event.slug}`];
  }

  if (event.entity === "genre-page" && event.genre && event.platform) {
    return [`/best/${event.genre}`, `/best/${event.genre}/${event.platform}`];
  }

  if (event.entity === "hardware-page" && event.ram) {
    return [`/hardware/${event.ram}`];
  }

  return [];
}

export function planRevalidationForPublication(
  event: PublicationEvent
): RevalidationPlan {
  const tagInput = toTagInput(event);
  const tags = buildRevalidateTags(tagInput);
  const paths = getPathList(event);

  return {
    tags,
    paths
  };
}
