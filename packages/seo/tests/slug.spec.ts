import { describe, expect, it } from "vitest";
import { generateSubjectSlug } from "../src/slug";

describe("SEO Agent - slug generation", () => {
  it("deve normalizar caracteres especiais e espacos", () => {
    expect(generateSubjectSlug("ChatGPT: Shadow of the Erdtree")).toBe(
      "chatgpt-shadow-of-the-erdtree"
    );
  });

  it("deve remover acentos e manter formato URL-safe", () => {
    expect(generateSubjectSlug("Pokémon Épico Online")).toBe(
      "pokemon-epico-online"
    );
  });

  it("deve impedir slug vazio", () => {
    expect(() => generateSubjectSlug("   ")).toThrow(
      "Subject name cannot generate an empty slug"
    );
  });
});
