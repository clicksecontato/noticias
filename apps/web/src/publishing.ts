import { buildWebMetadata, type WebMetadataInput } from "./page-metadata";
import { getPageStrategy, type PublishingPageType } from "./page-strategy";

export type { PublishingPageType } from "./page-strategy";

export interface RevalidateTagInput {
  pageType: PublishingPageType;
  slug?: string;
  genre?: string;
  platform?: string;
  ram?: string;
}

export interface RouteMetadataOutput {
  title: string;
  description: string;
  alternates: {
    canonical: string;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: "article" | "website";
  };
}

export function getRevalidateSeconds(pageType: PublishingPageType): number {
  return getPageStrategy(pageType).revalidateSeconds;
}

export function buildRevalidateTags(input: RevalidateTagInput): string[] {
  const tags = [`page:${input.pageType}`];

  if (input.slug) {
    tags.push(`${input.pageType}:${input.slug}`);
  }

  if (input.ram) {
    tags.push(`hardware:${input.ram}`);
  }

  if (input.genre) {
    tags.push(`genre:${input.genre}`);
  }

  if (input.platform) {
    tags.push(`platform:${input.platform}`);
  }

  return tags;
}

export function generateStaticParamsFromSlugs(
  paramKey: string,
  slugs: string[]
): Record<string, string>[] {
  return slugs.map((slug) => ({ [paramKey]: slug }));
}

export function generateRouteMetadata(input: WebMetadataInput): RouteMetadataOutput {
  const metadata = buildWebMetadata(input);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.canonicalUrl
    },
    openGraph: metadata.openGraph
  };
}
