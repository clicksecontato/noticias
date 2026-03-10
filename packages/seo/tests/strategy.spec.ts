import { describe, expect, it } from "vitest";
import { getSeoStrategy } from "../src/strategy";

describe("SEO Agent - strategy registry", () => {
  it("deve retornar estrategia de news com open graph article", () => {
    const strategy = getSeoStrategy("news");
    expect(strategy.openGraphType).toBe("article");
    expect(strategy.titleTemplate("Atualizacao GTA 6")).toContain("Atualizacao GTA 6");
  });

  it("deve retornar estrategia de genre com template de plataforma", () => {
    const strategy = getSeoStrategy("genre");
    expect(strategy.openGraphType).toBe("website");
    expect(strategy.titleTemplate("RPG", "PC")).toContain("PC");
  });
});
