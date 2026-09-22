import { describe, expect, it } from "vitest";
import { getCoreTableDefinitions } from "../src/schema-contract";

describe("Database Agent - indexes and constraints contracts", () => {
  it("deve definir indices de escala para tabela subjects", () => {
    const subjects = getCoreTableDefinitions().find((entry) => entry.table === "subjects");

    expect(subjects).toBeDefined();
    expect(subjects?.requiredIndexes).toEqual(
      expect.arrayContaining([
        "subjects_slug_unique_idx",
        "subjects_release_date_idx",
        "subjects_search_vector_idx"
      ])
    );
  });

  it("deve definir constraints de integridade para articles", () => {
    const articles = getCoreTableDefinitions().find(
      (entry) => entry.table === "articles"
    );

    expect(articles).toBeDefined();
    expect(articles?.requiredConstraints).toEqual(
      expect.arrayContaining([
        "articles_pk",
        "articles_slug_unique",
        "articles_status_check"
      ])
    );
  });
});
