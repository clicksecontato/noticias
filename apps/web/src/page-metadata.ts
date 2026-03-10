import { getWebConfig } from "./config";
import { getPageStrategy } from "./page-strategy";

export interface WebMetadataInput {
  pageType: "news" | "game" | "games-like" | "best" | "hardware";
  titleBase: string;
  descriptionBase: string;
  canonicalPath: string;
}

export interface WebMetadataOutput {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: "article" | "website";
  };
}

function trimToLength(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function normalizeDescription(text: string): string {
  const min = 120;
  const max = 160;
  const { descriptionSuffix } = getWebConfig();

  let value = text.trim();
  if (value.length > max) {
    value = trimToLength(value, max);
  }

  if (value.length < min) {
    value = `${value} ${descriptionSuffix}`;
    value = trimToLength(value, max);
  }

  if (value.length < min) {
    value = value.padEnd(min, ".");
  }

  return value;
}

export function buildWebMetadata(input: WebMetadataInput): WebMetadataOutput {
  const { siteUrl } = getWebConfig();
  const strategy = getPageStrategy(input.pageType);
  const canonicalUrl = `${siteUrl}${input.canonicalPath}`;
  const title = trimToLength(input.titleBase, 60);
  const description = normalizeDescription(input.descriptionBase);

  return {
    title,
    description,
    canonicalUrl,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: strategy.openGraphType
    }
  };
}
