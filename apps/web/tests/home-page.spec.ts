import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(__dirname, "../app/page.tsx"), "utf8");

describe("home page — hub operacional", () => {
  it("redireciona para /admin (ferramenta pessoal)", () => {
    expect(homePage).toMatch(/redirect\(["']\/admin["']\)/);
    expect(homePage).not.toMatch(/Mais lidas/);
    expect(homePage).not.toMatch(/VideoCard/);
  });
});
