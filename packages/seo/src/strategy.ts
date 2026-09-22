export type SeoPageType = "subject" | "news" | "type";

export interface SeoStrategy {
  pageType: SeoPageType;
  openGraphType: "article" | "website";
  titleTemplate: (entityName: string) => string;
}

const STRATEGIES: Record<SeoPageType, SeoStrategy> = {
  subject: {
    pageType: "subject",
    openGraphType: "website",
    titleTemplate: (entityName) => `${entityName}: guia, noticias e analise`
  },
  news: {
    pageType: "news",
    openGraphType: "article",
    titleTemplate: (entityName) => `${entityName} | noticias`
  },
  type: {
    pageType: "type",
    openGraphType: "website",
    titleTemplate: (entityName) => `Melhores assuntos de ${entityName}`
  }
};

export function getSeoStrategy(pageType: SeoPageType): SeoStrategy {
  return STRATEGIES[pageType];
}
