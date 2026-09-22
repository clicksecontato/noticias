import { describe, expect, it } from "vitest";
import { handleAdminYoutubeShortsRequest } from "../src/api/admin-youtube-shorts-handler";

describe("admin youtube shorts handler", () => {
  it("deve bloquear chamada sem sessao e sem token valido", async () => {
    const response = await handleAdminYoutubeShortsRequest(
      {
        sourceUrl: "https://www.youtube.com/shorts/abc123XYZ09",
      },
      {
        ADMIN_INGEST_TOKEN: "segredo",
        authorizedBySession: false,
      },
      async () => ({
        jobId: "j1",
        status: "completed",
        message: "ok",
      })
    );

    expect(response.status).toBe(401);
  });

  it("deve permitir com sessao valida", async () => {
    const response = await handleAdminYoutubeShortsRequest(
      {
        sourceUrl: "https://www.youtube.com/shorts/abc123XYZ09",
      },
      {
        ADMIN_INGEST_TOKEN: "segredo",
        authorizedBySession: true,
      },
      async () => ({
        jobId: "j2",
        status: "processing",
        message: "em processamento",
      })
    );

    expect(response.status).toBe(200);
    expect(response.body.jobId).toBe("j2");
  });

  it("deve permitir com token valido", async () => {
    const response = await handleAdminYoutubeShortsRequest(
      {
        sourceUrl: "https://www.youtube.com/shorts/abc123XYZ09",
        token: "segredo",
      },
      {
        ADMIN_INGEST_TOKEN: "segredo",
        authorizedBySession: false,
      },
      async () => ({
        jobId: "j3",
        status: "completed",
        message: "ok",
      })
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("completed");
  });
});
