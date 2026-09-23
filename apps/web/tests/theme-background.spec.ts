import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(__dirname, "../app/globals.css"),
  "utf8"
);

describe("theme background (exemplo-layout.jpg)", () => {
  it("define fundo dark carvão azulado amostrado da referência", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(darkBlock).toBeTruthy();
    expect(darkBlock).toMatch(/--background:\s*#2e3539\b/);
  });

  it("define degradê de página com tons semelhantes da referência", () => {
    expect(globalsCss).toMatch(
      /--grad-page:\s*[^;]*#3b4347[^;]*#2e3539[^;]*#22282c/
    );
  });

  it("aplica o degradê de página no body dark", () => {
    const bodyBlock = globalsCss.match(/body\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).toContain("var(--grad-page)");
  });
});
