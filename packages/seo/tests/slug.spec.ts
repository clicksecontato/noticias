import { describe, expect, it } from "vitest";
import { generateGameSlug } from "../src/slug";

describe("SEO Agent - slug generation", () => {
  it("deve normalizar caracteres especiais e espacos", () => {
    expect(generateGameSlug("Elden Ring: Shadow of the Erdtree")).toBe(
      "elden-ring-shadow-of-the-erdtree"
    );
  });

  it("deve remover acentos e manter formato URL-safe", () => {
    expect(generateGameSlug("Pokémon Épico Online")).toBe(
      "pokemon-epico-online"
    );
  });

  it("deve impedir slug vazio", () => {
    expect(() => generateGameSlug("   ")).toThrow(
      "Game name cannot generate an empty slug"
    );
  });
});
