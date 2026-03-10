import { describe, expect, it } from "vitest";
import { createRouteContentProvider } from "../src/content-provider";

describe("Web Application Agent - content provider", () => {
  it("deve prover slugs para rotas dinamicas", async () => {
    const provider = createRouteContentProvider();

    expect((await provider.getNewsSlugs()).length).toBeGreaterThan(0);
    expect((await provider.getGameSlugs()).length).toBeGreaterThan(0);
    expect((await provider.getBestGenres()).length).toBeGreaterThan(0);
    expect((await provider.getBestGenrePlatformPairs()).length).toBeGreaterThan(0);
    expect((await provider.getHardwareProfiles()).length).toBeGreaterThan(0);
  });

  it("deve prover metadata base por slug", async () => {
    const provider = createRouteContentProvider();

    const newsMetadata = await provider.getNewsMetadataBySlug("novo-trailer-de-gta-6");
    const gameMetadata = await provider.getGameMetadataBySlug("elden-ring");

    expect(newsMetadata.titleBase.toLowerCase()).toContain("gta");
    expect(newsMetadata.descriptionBase.length).toBeGreaterThan(20);
    expect(gameMetadata.titleBase.toLowerCase()).toContain("elden");
    expect(gameMetadata.descriptionBase.length).toBeGreaterThan(20);
  });
});
