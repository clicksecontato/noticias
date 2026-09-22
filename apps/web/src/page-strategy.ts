export type PublishingPageType = "news" | "subject" | "subjects-like" | "best";

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
  subject: {
    pageType: "subject",
    revalidateSeconds: 86400,
    openGraphType: "website"
  },
  "subjects-like": {
    pageType: "subjects-like",
    revalidateSeconds: 86400,
    openGraphType: "website"
  },
  best: {
    pageType: "best",
    revalidateSeconds: 43200,
    openGraphType: "website"
  }
};

export function getPageStrategy(pageType: PublishingPageType): PageStrategy {
  return STRATEGIES[pageType];
}
