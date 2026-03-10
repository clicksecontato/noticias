export type SeoPageType = "game" | "news" | "genre";

export interface SeoStrategy {
  pageType: SeoPageType;
  openGraphType: "article" | "website";
  titleTemplate: (entityName: string, platform?: string) => string;
}

const STRATEGIES: Record<SeoPageType, SeoStrategy> = {
  game: {
    pageType: "game",
    openGraphType: "website",
    titleTemplate: (entityName) => `${entityName}: guia, noticias e analise`
  },
  news: {
    pageType: "news",
    openGraphType: "article",
    titleTemplate: (entityName) => `${entityName} | noticias de games`
  },
  genre: {
    pageType: "genre",
    openGraphType: "website",
    titleTemplate: (entityName, platform) => {
      const platformPart = platform ? ` para ${platform}` : "";
      return `Melhores jogos de ${entityName}${platformPart}`;
    }
  }
};

export function getSeoStrategy(pageType: SeoPageType): SeoStrategy {
  return STRATEGIES[pageType];
}
