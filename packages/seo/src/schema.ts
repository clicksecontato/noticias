export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface GameSchemaInput {
  name: string;
  description: string;
  genre: string;
  platform: string;
  url: string;
}

export interface NewsSchemaInput {
  headline: string;
  description: string;
  datePublished: string;
  authorName: string;
  url: string;
}

export interface VideoGameSchema {
  "@context": "https://schema.org";
  "@type": "VideoGame";
  name: string;
  description: string;
  genre: string;
  gamePlatform: string;
  url: string;
}

export interface NewsArticleSchema {
  "@context": "https://schema.org";
  "@type": "NewsArticle";
  headline: string;
  description: string;
  datePublished: string;
  author: {
    "@type": "Person";
    name: string;
  };
  mainEntityOfPage: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function buildGameSchema(input: GameSchemaInput): VideoGameSchema {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: input.name,
    description: input.description,
    genre: input.genre,
    gamePlatform: input.platform,
    url: input.url
  };
}

export function buildNewsSchema(input: NewsSchemaInput): NewsArticleSchema {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    author: {
      "@type": "Person",
      name: input.authorName
    },
    mainEntityOfPage: input.url
  };
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[]
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  };
}
