import { describe, expect, it } from "vitest";
import { getCoreTableDefinitions } from "../src/schema-contract";

const REQUIRED_TABLES = [
  "subjects",
  "types",
  "tags",
  "subject_tags",
  "articles",
  "sources",
  "article_sources",
  "seo_pages"
];

describe("Database Agent - core schema contracts", () => {
  it("deve conter todas as tabelas obrigatorias", () => {
    const tables = getCoreTableDefinitions().map((entry) => entry.table);

    for (const requiredTable of REQUIRED_TABLES) {
      expect(tables).toContain(requiredTable);
    }
    expect(tables).not.toContain("platforms");
    expect(tables).not.toContain("games");
    expect(tables).not.toContain("genres");
  });

  it("deve exigir colunas essenciais para tabela subjects", () => {
    const subjectTable = getCoreTableDefinitions().find(
      (entry) => entry.table === "subjects"
    );

    expect(subjectTable).toBeDefined();
    expect(subjectTable?.requiredColumns).toEqual(
      expect.arrayContaining(["id", "slug", "name", "release_date"])
    );
    expect(subjectTable?.requiredIndexes).toEqual(
      expect.arrayContaining(["subjects_slug_unique_idx"])
    );
  });

  it("deve exigir colunas essenciais para tabela articles", () => {
    const articleTable = getCoreTableDefinitions().find(
      (entry) => entry.table === "articles"
    );

    expect(articleTable).toBeDefined();
    expect(articleTable?.requiredColumns).toEqual(
      expect.arrayContaining(["id", "slug", "title", "published_at", "status"])
    );
    expect(articleTable?.requiredIndexes).toEqual(
      expect.arrayContaining([
        "articles_slug_unique_idx",
        "articles_published_at_idx"
      ])
    );
  });
});
