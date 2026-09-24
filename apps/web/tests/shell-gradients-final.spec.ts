import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(__dirname, "../app/globals.css"),
  "utf8"
);
const sidebar = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminSidebar.tsx"),
  "utf8"
);

describe("shell gradients (exemplo-layout-final)", () => {
  it("define degradê de página e de sidebar no tema dark", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(darkBlock).toMatch(/--grad-page:/);
    expect(darkBlock).toMatch(/--grad-sidebar:/);
    expect(darkBlock).toMatch(/#594f46/);
    expect(darkBlock).toMatch(/#242625/);
  });

  it("sidebar usa grad-sidebar em vez de fundo sólido opaco", () => {
    expect(sidebar).toMatch(/grad-sidebar|admin-sidebar-surface/);
    expect(sidebar).not.toMatch(/bg-\[#161514\]\/95/);
  });

  it("sidebar tem brilho gold na base", () => {
    expect(sidebar).toMatch(/sidebar-glow|gold.*glow|pointer-events-none.*bottom/i);
  });
});
