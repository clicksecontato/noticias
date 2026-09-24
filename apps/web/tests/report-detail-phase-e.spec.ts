import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderers = readFileSync(
  resolve(__dirname, "../app/reports/report-detail-renderers.tsx"),
  "utf8"
);
const monthClient = readFileSync(
  resolve(__dirname, "../app/admin/month-presentation/MonthPresentationClient.tsx"),
  "utf8"
);
const collapsible = readFileSync(
  resolve(__dirname, "../app/components/reports/ReportCollapsibleTable.tsx"),
  "utf8"
);
const volumeChart = readFileSync(
  resolve(__dirname, "../app/components/reports/VolumeChart.tsx"),
  "utf8"
);
const topSourcesChart = readFileSync(
  resolve(__dirname, "../app/components/reports/TopSourcesChart.tsx"),
  "utf8"
);
const radarChart = readFileSync(
  resolve(__dirname, "../app/components/reports/RadarPautaChart.tsx"),
  "utf8"
);
const detailPage = readFileSync(
  resolve(__dirname, "../app/admin/reports/[id]/page.tsx"),
  "utf8"
);

describe("report detail phase E", () => {
  it("month_presentation embute MonthPresentationClient", () => {
    expect(renderers).toMatch(/MonthPresentationClient/);
    expect(renderers).toMatch(/embedded/);
    expect(monthClient).toMatch(/embedded\??/);
    expect(monthClient).toMatch(/embedded/);
  });

  it("detail page passa reportId para ReportPayload", () => {
    expect(detailPage).toMatch(/reportId=/);
    expect(renderers).toMatch(/reportId\??/);
  });

  it("tabelas de detalhe usam ReportCollapsibleTable", () => {
    expect(collapsible).toMatch(/export function ReportCollapsibleTable/);
    expect(renderers).toMatch(/ReportCollapsibleTable/);
  });

  it("charts principais usam NeoChartContainer", () => {
    expect(volumeChart).toMatch(/NeoChartContainer/);
    expect(topSourcesChart).toMatch(/NeoChartContainer/);
    expect(radarChart).toMatch(/NeoChartContainer/);
  });
});
