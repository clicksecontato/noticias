import { describe, expect, it } from "vitest";
import { handleAdminIngestRequest } from "../src/api/admin-ingest-handler";

describe("Web Application Agent - admin ingest API", () => {
  it("deve bloquear chamada sem token valido", async () => {
    const response = await handleAdminIngestRequest(
      {
        token: "invalid",
        sourceIds: ["s1"]
      },
      {
        ADMIN_INGEST_TOKEN: "secret-token"
      },
      async () => ({
        processedSourceIds: ["s1"],
        createdArticles: 2,
        discardedByLanguage: 0
      })
    );

    expect(response.status).toBe(401);
  });

  it("deve executar ingestao manual com token valido", async () => {
    const response = await handleAdminIngestRequest(
      {
        token: "secret-token",
        sourceIds: ["s1"]
      },
      {
        ADMIN_INGEST_TOKEN: "secret-token"
      },
      async () => ({
        processedSourceIds: ["s1"],
        createdArticles: 2,
        discardedByLanguage: 1
      })
    );

    expect(response.status).toBe(200);
    expect(response.body.createdArticles).toBe(2);
    expect(response.body.discardedByLanguage).toBe(1);
  });
});
