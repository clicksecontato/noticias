import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminLayout = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminLayoutClient.tsx"),
  "utf8"
);
const navigation = readFileSync(
  resolve(__dirname, "../app/components/Navigation.tsx"),
  "utf8"
);
const footer = readFileSync(
  resolve(__dirname, "../app/components/Footer.tsx"),
  "utf8"
);

describe("shell background continuity (admin ≈ /videos)", () => {
  it("admin main não pinta degradê próprio sobre o fundo da página", () => {
    expect(adminLayout).not.toMatch(/bg-gradient-to-br/);
    expect(adminLayout).not.toMatch(/from-background/);
    expect(adminLayout).toMatch(/<main className="[^"]*pl-56/);
  });

  it("nav e footer usam token de fundo (sem hex legado preto)", () => {
    expect(navigation).not.toMatch(/bg-\[#161616\]/);
    expect(navigation).toMatch(/bg-background\//);
    expect(footer).not.toMatch(/bg-\[#141414\]/);
    expect(footer).toMatch(/bg-background\//);
  });

  it("nav sticky não deixa faixa fantasma (spacer) abaixo do menu", () => {
    expect(navigation).not.toMatch(/h-16 shrink-0/);
  });
});
