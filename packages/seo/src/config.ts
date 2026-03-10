export interface SeoConfig {
  baseUrl: string;
  metadataDescriptionSuffix: string;
  maxUrlsPerSitemap: number;
}

const DEFAULT_BASE_URL = "https://www.noticiasgames.com";
const DEFAULT_METADATA_SUFFIX =
  "Descubra analises, recomendacoes e atualizacoes recentes com foco em gameplay, plataformas e tendencias da comunidade gamer.";
const DEFAULT_MAX_URLS_PER_SITEMAP = 5000;

export function getSeoConfig(
  env: Record<string, string | undefined> = process.env
): SeoConfig {
  const parsedMaxUrls = Number.parseInt(env.SEO_MAX_URLS_PER_SITEMAP || "", 10);
  const maxUrlsPerSitemap = Number.isFinite(parsedMaxUrls) && parsedMaxUrls > 0
    ? parsedMaxUrls
    : DEFAULT_MAX_URLS_PER_SITEMAP;

  return {
    baseUrl: env.SEO_BASE_URL?.trim() || DEFAULT_BASE_URL,
    metadataDescriptionSuffix: env.SEO_METADATA_SUFFIX?.trim() || DEFAULT_METADATA_SUFFIX,
    maxUrlsPerSitemap
  };
}
