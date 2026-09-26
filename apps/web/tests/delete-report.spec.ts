import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const client = readFileSync(resolve(__dirname, "../app/reports/ReportsClient.tsx"), "utf8");
const route = readFileSync(resolve(__dirname, "../app/api/admin/reports/[id]/route.ts"), "utf8");
const repo = readFileSync(
  resolve(__dirname, "../../../packages/database/src/report-repository.ts"),
  "utf8"
);

describe("apagar relatório gerado", () => {
  it("a lista oferece exclusão e chama DELETE", () => {
    expect(client).toMatch(/Apagar/);
    expect(client).toMatch(/useSystemDialogs/);
    expect(client).toMatch(/showConfirm/);
    expect(client).not.toMatch(/window\.confirm/);
    expect(client).toMatch(/<article/);
    expect(client).not.toMatch(/<Link/);
    expect(client).toMatch(/method:\s*"DELETE"/);
    expect(client).toMatch(/\/api\/admin\/reports\//);
  });

  it("a rota admin remove o relatório pelo id", () => {
    expect(route).toMatch(/export async function DELETE/);
    expect(route).toMatch(/deleteReport/);
  });

  it("o repositório apaga o relatório (resultado em cascata)", () => {
    expect(repo).toMatch(/deleteReport\(/);
    expect(repo).toMatch(/from\("reports"\)\.delete\(\)/);
  });
});
