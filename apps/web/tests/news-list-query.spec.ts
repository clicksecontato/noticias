import { describe, expect, it } from "vitest";
import {
  buildNewsQueryPath,
  parseNewsListParams
} from "../src/news-list-query";

describe("Web Application Agent - news list query", () => {
  it("deve aplicar defaults seguros", () => {
    const params = parseNewsListParams({});

    expect(params.page).toBe(1);
    expect(params.sourceId).toBe("");
    expect(params.query).toBe("");
    expect(params.sortMode).toBe("published_desc");
  });

  it("deve sanitizar page e sort invalidos", () => {
    const params = parseNewsListParams({
      page: "-3",
      sort: "invalid"
    });

    expect(params.page).toBe(1);
    expect(params.sortMode).toBe("published_desc");
  });

  it("deve montar query path preservando filtros", () => {
    const path = buildNewsQueryPath({
      page: 2,
      sourceId: "s1",
      query: "gta",
      sortMode: "published_asc",
      basePath: "/news"
    });

    expect(path).toContain("/news?");
    expect(path).toContain("page=2");
    expect(path).toContain("source=s1");
    expect(path).toContain("q=gta");
    expect(path).toContain("sort=published_asc");
  });
});
