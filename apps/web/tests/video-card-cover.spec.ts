import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const videoCard = readFileSync(
  resolve(__dirname, "../app/components/VideoCard.tsx"),
  "utf8"
);
const cardUi = readFileSync(
  resolve(__dirname, "../components/ui/card.tsx"),
  "utf8"
);

describe("VideoCard capa no topo arredondado", () => {
  it("card remove padding superior para a capa colar no topo", () => {
    expect(videoCard).toMatch(/pt-0/);
    expect(videoCard).toMatch(/overflow-hidden/);
  });

  it("thumbnail preenche a largura com object-cover e raio superior", () => {
    expect(videoCard).toMatch(/object-cover/);
    expect(videoCard).toMatch(/aspect-video/);
    expect(videoCard).toMatch(/rounded-t-\[(?:inherit|var\(--radius\)|calc\(var\(--radius\))/);
  });

  it("Card base reconhece mídia no primeiro filho (link ou img)", () => {
    expect(cardUi).toMatch(/has-\[>a:first-child\]:pt-0/);
  });
});
