import { describe, expect, it } from "vitest";
import { getSeoConfig } from "../src/config";

describe("SEO Agent - config provider", () => {
  it("deve retornar valores padrao de configuracao", () => {
    const config = getSeoConfig({});

    expect(config.baseUrl).toBe("https://www.noticiasgames.com");
    expect(config.maxUrlsPerSitemap).toBe(5000);
    expect(config.metadataDescriptionSuffix.length).toBeGreaterThan(20);
  });

  it("deve permitir override por variavel de ambiente", () => {
    const config = getSeoConfig({
      SEO_BASE_URL: "https://preview.noticiasgames.com",
      SEO_MAX_URLS_PER_SITEMAP: "2000",
      SEO_METADATA_SUFFIX: "Resumo customizado para SEO."
    });

    expect(config.baseUrl).toBe("https://preview.noticiasgames.com");
    expect(config.maxUrlsPerSitemap).toBe(2000);
    expect(config.metadataDescriptionSuffix).toContain("customizado");
  });
});
