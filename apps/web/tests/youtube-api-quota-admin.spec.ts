import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = (...p: string[]) => resolve(__dirname, ...p);

describe("youtube api quota admin", () => {
  it("migration cria tabela de eventos de cota", () => {
    const sql = readFileSync(
      root("../../../packages/database/migrations/030_youtube_api_quota_events.sql"),
      "utf8"
    );
    expect(sql).toMatch(/youtube_api_quota_events/);
    expect(sql).toMatch(/quota_day/);
    expect(sql).toMatch(/units/);
  });

  it("sidebar tem aba API YouTube", () => {
    const sidebar = readFileSync(
      root("../app/admin/components/AdminSidebar.tsx"),
      "utf8"
    );
    expect(sidebar).toMatch(/\/admin\/youtube-api/);
    expect(sidebar).toMatch(/API YouTube/);
  });

  it("página e API de cota existem", () => {
    const page = readFileSync(
      root("../app/admin/youtube-api/page.tsx"),
      "utf8"
    );
    const client = readFileSync(
      root("../app/admin/youtube-api/YoutubeApiQuotaClient.tsx"),
      "utf8"
    );
    const api = readFileSync(
      root("../app/api/admin/youtube-quota/route.ts"),
      "utf8"
    );
    expect(page).toMatch(/YoutubeApiQuotaClient/);
    expect(client).toMatch(/unitsUsed|Cota/);
    expect(api).toMatch(/buildYoutubeQuotaSummary|getYoutubeQuota/);
  });

  it("chamadas à API registram uso", () => {
    const avatar = readFileSync(
      root("../src/admin/youtube-channel-avatar.ts"),
      "utf8"
    );
    const ingestion = readFileSync(root("../src/content-ingestion.ts"), "utf8");
    const sourceClient = readFileSync(
      root("../src/youtube-shorts/youtube-source-client.ts"),
      "utf8"
    );
    const uploader = readFileSync(
      root("../src/youtube-shorts/youtube-target-uploader.ts"),
      "utf8"
    );
    const sourcesRoute = readFileSync(
      root("../app/api/admin/sources/route.ts"),
      "utf8"
    );
    expect(avatar).toMatch(/recordYoutubeApiCall/);
    expect(ingestion).toMatch(/recordYoutubeApiCall|onApiCall/);
    expect(sourceClient).toMatch(/recordYoutubeApiCall/);
    expect(uploader).toMatch(/recordYoutubeApiCall/);
    expect(sourcesRoute).toMatch(/recordYoutubeApiCall/);
  });
});
