import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const videoCard = readFileSync(
  resolve(__dirname, "../app/components/VideoCard.tsx"),
  "utf8"
);
const videosClient = readFileSync(
  resolve(__dirname, "../app/admin/videos/VideosClient.tsx"),
  "utf8"
);

describe("vídeos sem descrição na listagem", () => {
  it("VideoCard não renderiza descrição do vídeo", () => {
    expect(videoCard).not.toMatch(/video\.description/);
    expect(videoCard).not.toMatch(/CardDescription/);
  });

  it("admin /videos não exibe coluna Descrição", () => {
    expect(videosClient).not.toMatch(/>Descrição</);
    expect(videosClient).not.toMatch(/v\.description/);
  });
});
