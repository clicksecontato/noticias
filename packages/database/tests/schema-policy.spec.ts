import { describe, expect, it } from "vitest";
import { getSchemaPolicies } from "../src/schema-policy";

describe("Database Agent - schema policy registry", () => {
  it("deve expor politica para todas as tabelas nucleares", () => {
    const policies = getSchemaPolicies();
    const tables = policies.map((policy) => policy.table);

    expect(tables).toEqual(
      expect.arrayContaining([
        "subjects",
        "types",
        "tags",
        "subject_tags",
        "articles",
        "sources",
        "article_sources",
        "seo_pages"
      ])
    );
    expect(tables).not.toContain("platforms");
    expect(tables).not.toContain("games");
    expect(tables).not.toContain("genres");
    expect(tables).not.toContain("game_tags");
  });

  it("deve manter politica forte de integridade para articles", () => {
    const articles = getSchemaPolicies().find((policy) => policy.table === "articles");

    expect(articles).toBeDefined();
    expect(articles?.requiredConstraints).toEqual(
      expect.arrayContaining([
        "articles_pk",
        "articles_slug_unique",
        "articles_status_check"
      ])
    );
    expect(articles?.requiredIndexes).toEqual(
      expect.arrayContaining(["articles_slug_unique_idx", "articles_published_at_idx"])
    );
  });
});
