import { describe, expect, it } from "vitest";
import { buildMetadata } from "../src/metadata";

describe("SEO Agent - metadata generation", () => {
  it("deve gerar title e description para pagina de jogo", () => {
    const metadata = buildMetadata({
      pageType: "game",
      entityName: "Elden Ring"
    });

    expect(metadata.title).toContain("Elden Ring");
    expect(metadata.title.length).toBeLessThanOrEqual(60);
    expect(metadata.description.length).toBeGreaterThanOrEqual(120);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
  });

  it("deve gerar metadata orientada a intencao para pagina de genero", () => {
    const metadata = buildMetadata({
      pageType: "genre",
      entityName: "RPG",
      platform: "PC"
    });

    expect(metadata.title.toLowerCase()).toContain("rpg");
    expect(metadata.description.toLowerCase()).toContain("pc");
  });
});
