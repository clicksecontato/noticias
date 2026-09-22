import { describe, expect, it } from "vitest";
import { getStaticRouteParams } from "../src/params-provider";

describe("Web Application Agent - params provider", () => {
  it("deve fornecer slugs para rotas de news e subject", () => {
    const newsParams = getStaticRouteParams("news");
    const subjectParams = getStaticRouteParams("subject");

    expect(newsParams.length).toBeGreaterThan(0);
    expect(subjectParams.length).toBeGreaterThan(0);
    expect(newsParams[0]).toHaveProperty("slug");
    expect(subjectParams[0]).toHaveProperty("slug");
  });

  it("deve fornecer parametros para best-type", () => {
    const bestParams = getStaticRouteParams("best");

    expect(bestParams.length).toBeGreaterThan(0);
    expect(bestParams[0]).toHaveProperty("type");
  });

  it("deve fornecer slugs para subjects-like", () => {
    const subjectsLikeParams = getStaticRouteParams("subjects-like");
    expect(subjectsLikeParams.length).toBeGreaterThan(0);
    expect(subjectsLikeParams[0]).toHaveProperty("slug");
  });
});
