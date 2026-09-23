import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(__dirname, "../app/globals.css"),
  "utf8"
);

describe("theme background (exemplo-layout-final)", () => {
  it("define fundo dark carvão profundo do modelo final", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(darkBlock).toBeTruthy();
    expect(darkBlock).toMatch(/--background:\s*#1a1a1a\b/);
  });

  it("define degradê de página carvão", () => {
    expect(globalsCss).toMatch(/--grad-page:\s*[^;]*#1a1a1a/);
  });

  it("aplica o degradê de página no body dark", () => {
    const bodyBlock = globalsCss.match(/body\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).toContain("var(--grad-page)");
  });
});
