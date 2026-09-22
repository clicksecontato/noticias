export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface SubjectSchemaInput {
  name: string;
  description: string;
  url: string;
}

export interface NewsSchemaInput {
  headline: string;
  description: string;
  datePublished: string;
  authorName: string;
  url: string;
}

export interface SubjectSchema {
  "@context": "https://schema.org";
  "@type": "Thing";
  name: string;
  description: string;
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

export function buildSubjectSchema(input: SubjectSchemaInput): SubjectSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: input.name,
    description: input.description,
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
