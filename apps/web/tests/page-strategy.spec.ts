import { describe, expect, it } from "vitest";
import { getPageStrategy } from "../src/page-strategy";

describe("Web Application Agent - page strategy registry", () => {
  it("deve retornar estrategia de noticia com og article e ISR curto", () => {
    const strategy = getPageStrategy("news");
    expect(strategy.openGraphType).toBe("article");
    expect(strategy.revalidateSeconds).toBe(900);
  });

  it("deve retornar estrategia de best com og website", () => {
    const strategy = getPageStrategy("best");
    expect(strategy.openGraphType).toBe("website");
    expect(strategy.revalidateSeconds).toBe(43200);
  });
});
