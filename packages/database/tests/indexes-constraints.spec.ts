import { describe, expect, it } from "vitest";
import { getCoreTableDefinitions } from "../src/schema-contract";

describe("Database Agent - indexes and constraints contracts", () => {
  it("deve definir indices de escala para tabela games", () => {
    const games = getCoreTableDefinitions().find((entry) => entry.table === "games");

    expect(games).toBeDefined();
    expect(games?.requiredIndexes).toEqual(
      expect.arrayContaining([
        "games_slug_unique_idx",
        "games_release_date_idx",
        "games_search_vector_idx"
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
