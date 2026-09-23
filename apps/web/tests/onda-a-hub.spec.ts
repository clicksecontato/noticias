import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(__dirname, "../app/page.tsx"), "utf8");
const adminPage = readFileSync(
  resolve(__dirname, "../app/admin/page.tsx"),
  "utf8"
);
const sidebar = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminSidebar.tsx"),
  "utf8"
);

describe("onda A — hub operacional", () => {
  it("home redireciona para /admin", () => {
    expect(homePage).toMatch(/redirect\(["']\/admin["']\)/);
    expect(homePage).not.toMatch(/VideoCard/);
  });

  it("admin hub não redireciona mais para ingestão", () => {
    expect(adminPage).not.toMatch(/redirect\(["']\/admin\/ingestao["']\)/);
    expect(adminPage).toMatch(/AdminHubClient|Hub/);
  });

  it("sidebar segue fluxo Ingestão → Conteúdo → Catálogo → Relatórios", () => {
    const ingest = sidebar.indexOf('"/admin/ingestao"');
    const news = sidebar.indexOf('"/admin/noticias"');
    const subjects = sidebar.indexOf('"/admin/assuntos"');
    const reports = sidebar.indexOf('"/admin/reports"');
    expect(ingest).toBeGreaterThan(-1);
    expect(news).toBeGreaterThan(ingest);
    expect(subjects).toBeGreaterThan(news);
    expect(reports).toBeGreaterThan(subjects);
    expect(sidebar).not.toMatch(/youtube-shorts/);
  });
});
