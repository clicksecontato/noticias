import { describe, expect, it } from "vitest";
import { createContentRepository } from "../src/content-repository";

describe("Database Agent - sources selection", () => {
  it("deve retornar fontes ativas em portugues", async () => {
    const repository = createContentRepository();
    const sources = await repository.getActivePortugueseSources();

    expect(sources.length).toBeGreaterThan(0);
    expect(
      sources.every(
        (source) => source.isActive && (source.language === "pt-BR" || source.language === "pt")
      )
    ).toBe(true);
  });
});
