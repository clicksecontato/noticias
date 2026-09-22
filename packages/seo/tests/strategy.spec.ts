import { describe, expect, it } from "vitest";
import { getSeoStrategy } from "../src/strategy";

describe("SEO Agent - strategy registry", () => {
  it("deve retornar estrategia de news com open graph article", () => {
    const strategy = getSeoStrategy("news");
    expect(strategy.openGraphType).toBe("article");
    expect(strategy.titleTemplate("Atualizacao ChatGPT")).toContain("Atualizacao ChatGPT");
  });

  it("deve retornar estrategia de type sem plataforma", () => {
    const strategy = getSeoStrategy("type");
    expect(strategy.openGraphType).toBe("website");
    expect(strategy.titleTemplate("LLM")).toContain("LLM");
    expect(strategy.titleTemplate("LLM").toLowerCase()).not.toContain("plataforma");
  });

  it("deve retornar estrategia de subject", () => {
    const strategy = getSeoStrategy("subject");
    expect(strategy.openGraphType).toBe("website");
    expect(strategy.pageType).toBe("subject");
    expect(strategy.titleTemplate("ChatGPT")).toContain("ChatGPT");
  });
});
