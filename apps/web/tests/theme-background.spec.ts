import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(__dirname, "../app/globals.css"),
  "utf8"
);

describe("theme background (exemplo-layout-final)", () => {
  it("define fundo dark principal #242625", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(darkBlock).toBeTruthy();
    expect(darkBlock).toMatch(/--background:\s*#242625\b/);
  });

  it("define degradê #594f46 → #242625 antes da metade", () => {
    expect(globalsCss).toMatch(/--grad-page:[\s\S]*?#594f46[\s\S]*?#242625/);
    expect(globalsCss).toMatch(/--grad-sidebar:[\s\S]*?#594f46[\s\S]*?#242625/);
  });

  it("aplica o degradê de página no body dark", () => {
    const bodyBlock = globalsCss.match(/body\s*\{([\s\S]*?)\n  \}/)?.[1];
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).toContain("var(--grad-page)");
  });
});
