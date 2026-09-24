import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = (...parts: string[]) => resolve(__dirname, ...parts);
const migration = readFileSync(
  root("../../../packages/database/migrations/029_sources_image_url.sql"),
  "utf8"
);
const fontes = readFileSync(root("../app/admin/fontes/FontesClient.tsx"), "utf8");
const syncRoute = readFileSync(
  root("../app/api/admin/sources/sync-avatars/route.ts"),
  "utf8"
);
const sourcesRoute = readFileSync(
  root("../app/api/admin/sources/route.ts"),
  "utf8"
);
const sourceAvatar = readFileSync(
  root("../app/components/SourceAvatar.tsx"),
  "utf8"
);
const ingestion = readFileSync(
  root("../app/admin/AdminIngestionClient.tsx"),
  "utf8"
);
const videosClient = readFileSync(
  root("../app/admin/videos/VideosClient.tsx"),
  "utf8"
);
const videosRepo = readFileSync(
  root("../src/admin/videos-repository.ts"),
  "utf8"
);
const videoCard = readFileSync(root("../app/components/VideoCard.tsx"), "utf8");
const filterChip = readFileSync(
  root("../app/components/FilterChipRow.tsx"),
  "utf8"
);
const contentProvider = readFileSync(root("../src/content-provider.ts"), "utf8");
const contentRepo = readFileSync(
  root("../../../packages/database/src/content-repository.ts"),
  "utf8"
);
const reportRenderers = readFileSync(
  root("../app/reports/report-detail-renderers.tsx"),
  "utf8"
);
const reportDetail = readFileSync(
  root("../app/admin/reports/[id]/page.tsx"),
  "utf8"
);
const monthPresentation = readFileSync(
  root("../app/admin/month-presentation/MonthPresentationClient.tsx"),
  "utf8"
);

describe("sources youtube avatar", () => {
  it("migration adiciona image_url em sources", () => {
    expect(migration).toMatch(/image_url/);
    expect(migration).toMatch(/sources/);
  });

  it("cadastro YouTube busca perfil e persiste image_url", () => {
    expect(sourcesRoute).toMatch(/fetchYoutubeChannelProfile/);
    expect(sourcesRoute).toMatch(/image_url/);
  });

  it("sync-avatars backfill fontes youtube sem imagem", () => {
    expect(syncRoute).toMatch(/fetchYoutubeChannelProfile/);
    expect(syncRoute).toMatch(/image_url/);
  });

  it("FontesClient exibe avatar e dispara sync", () => {
    expect(fontes).toMatch(/imageUrl/);
    expect(fontes).toMatch(/sync-avatars/);
  });

  it("SourceAvatar componente compartilhado", () => {
    expect(sourceAvatar).toMatch(/export function SourceAvatar/);
    expect(sourceAvatar).toMatch(/imageUrl/);
  });

  it("ingestão lista fontes com SourceAvatar", () => {
    expect(ingestion).toMatch(/SourceAvatar/);
    expect(ingestion).toMatch(/imageUrl/);
  });

  it("admin videos carrega e exibe avatar da fonte", () => {
    expect(videosRepo).toMatch(/image_url/);
    expect(videosRepo).toMatch(/sourceImageUrl|imageUrl/);
    expect(videosClient).toMatch(/SourceAvatar/);
  });

  it("/videos público propaga sourceImageUrl até VideoCard e filtros", () => {
    expect(contentRepo).toMatch(/sourceImageUrl/);
    expect(contentProvider).toMatch(/sourceImageUrl/);
    expect(videoCard).toMatch(/SourceAvatar/);
    expect(filterChip).toMatch(/imageUrl|SourceAvatar/);
  });

  it("relatórios exibem avatar das fontes YouTube", () => {
    expect(reportDetail).toMatch(/sourceAvatars/);
    expect(reportRenderers).toMatch(/sourceAvatars/);
    expect(reportRenderers).toMatch(/SourceAvatar/);
    expect(monthPresentation).toMatch(/imageUrl|SourceAvatar/);
  });
});
