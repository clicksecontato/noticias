import { describe, expect, it } from "vitest";
import { getWebConfig } from "../src/config";

describe("Web Application Agent - config provider", () => {
  it("deve usar defaults quando env nao for informado", () => {
    const config = getWebConfig({});

    expect(config.siteUrl).toBe("https://www.noticiasgames.com");
    expect(config.descriptionSuffix.length).toBeGreaterThan(20);
  });

  it("deve permitir override por variavel de ambiente", () => {
    const config = getWebConfig({
      WEB_SITE_URL: "https://preview.noticiasgames.com",
      WEB_DESCRIPTION_SUFFIX: "Resumo editorial personalizado."
    });

    expect(config.siteUrl).toBe("https://preview.noticiasgames.com");
    expect(config.descriptionSuffix).toContain("personalizado");
  });
});
