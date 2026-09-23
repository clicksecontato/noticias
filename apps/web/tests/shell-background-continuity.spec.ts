import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminLayout = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminLayoutClient.tsx"),
  "utf8"
);
const appShell = readFileSync(
  resolve(__dirname, "../app/components/AppShell.tsx"),
  "utf8"
);
const navigation = readFileSync(
  resolve(__dirname, "../app/components/Navigation.tsx"),
  "utf8"
);

describe("shell admin sem menu topo", () => {
  it("admin main sem degradê próprio e com padding dinâmico da sidebar", () => {
    expect(adminLayout).not.toMatch(/bg-gradient-to-br/);
    expect(adminLayout).toMatch(/pl-16|pl-56/);
    expect(adminLayout).not.toMatch(/top-16/);
  });

  it("AppShell omite Navigation no admin", () => {
    expect(appShell).toMatch(/isAdminApp/);
    expect(appShell).toMatch(/Navigation/);
  });

  it("nav sticky sem spacer fantasma", () => {
    expect(navigation).not.toMatch(/h-16 shrink-0/);
  });
});
