import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const client = readFileSync(
  resolve(__dirname, "../app/reports/ReportsClient.tsx"),
  "utf8"
);
const meta = readFileSync(
  resolve(__dirname, "../src/reports/report-type-meta.ts"),
  "utf8"
);

describe("reports list visual gallery", () => {
  it("define meta visual por tipo (ícone + blurb)", () => {
    expect(meta).toMatch(/REPORT_TYPE_META/);
    expect(meta).toMatch(/radar_pauta/);
    expect(meta).toMatch(/month_presentation/);
    expect(meta).toMatch(/blurb/);
  });

  it("lista relatórios como cards clicáveis, não lista plana", () => {
    expect(client).toMatch(/ReportGalleryCard|report-gallery|grid.*reports/i);
    expect(client).toMatch(/REPORT_TYPE_META|getReportTypeMeta/);
    expect(client).not.toMatch(/list-none space-y-0/);
  });

  it("filtros de tipo em chips visuais", () => {
    expect(client).toMatch(/typeFilter|Filtrar/);
    expect(client).toMatch(/chip|rounded-xl.*type|TypeChip|filtro.*tipo/i);
  });
});
