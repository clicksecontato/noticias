export type PublishingPageType = "news" | "game" | "games-like" | "best" | "hardware";

export interface PageStrategy {
  pageType: PublishingPageType;
  revalidateSeconds: number;
  openGraphType: "article" | "website";
}

const STRATEGIES: Record<PublishingPageType, PageStrategy> = {
  news: {
    pageType: "news",
    revalidateSeconds: 900,
    openGraphType: "article"
  },
  game: {
    pageType: "game",
    revalidateSeconds: 86400,
    openGraphType: "website"
  },
  "games-like": {
    pageType: "games-like",
    revalidateSeconds: 86400,
    openGraphType: "website"
  },
  best: {
    pageType: "best",
    revalidateSeconds: 43200,
    openGraphType: "website"
  },
  hardware: {
    pageType: "hardware",
    revalidateSeconds: 43200,
    openGraphType: "website"
  }
};

export function getPageStrategy(pageType: PublishingPageType): PageStrategy {
  return STRATEGIES[pageType];
}
