import { describe, expect, it } from "vitest";
import { getStaticRouteParams } from "../src/params-provider";

describe("Web Application Agent - params provider", () => {
  it("deve fornecer slugs para rotas de news e game", () => {
    const newsParams = getStaticRouteParams("news");
    const gameParams = getStaticRouteParams("game");

    expect(newsParams.length).toBeGreaterThan(0);
    expect(gameParams.length).toBeGreaterThan(0);
    expect(newsParams[0]).toHaveProperty("slug");
    expect(gameParams[0]).toHaveProperty("slug");
  });

  it("deve fornecer combinacoes para best e parametros de hardware", () => {
    const bestParams = getStaticRouteParams("best");
    const hardwareParams = getStaticRouteParams("hardware");

    expect(bestParams.length).toBeGreaterThan(0);
    expect(hardwareParams.length).toBeGreaterThan(0);
    expect(hardwareParams[0]).toHaveProperty("ram");
  });
});
