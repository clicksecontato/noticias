import type { PublishingPageType } from "./page-strategy";

export type StaticRouteParam = Record<string, string>;

export function getStaticRouteParams(
  pageType: PublishingPageType
): StaticRouteParam[] {
  if (pageType === "news") {
    return [{ slug: "novo-trailer-de-gta-6" }, { slug: "atualizacao-elden-ring" }];
  }

  if (pageType === "game" || pageType === "games-like") {
    return [{ slug: "elden-ring" }, { slug: "baldurs-gate-3" }];
  }

  if (pageType === "best") {
    return [{ genre: "rpg" }, { genre: "fps" }, { genre: "survival" }];
  }

  return [{ ram: "8gb" }, { ram: "16gb" }, { ram: "32gb" }];
}

export function getBestGenrePlatformParams(): Array<{ genre: string; platform: string }> {
  return [
    { genre: "rpg", platform: "pc" },
    { genre: "fps", platform: "ps5" },
    { genre: "survival", platform: "xbox-series" }
  ];
}
