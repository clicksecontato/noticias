import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const renderers = readFileSync(
  resolve(__dirname, "../app/reports/report-detail-renderers.tsx"),
  "utf8"
);
const mapaChart = readFileSync(
  resolve(__dirname, "../app/components/reports/MapaTematicoChart.tsx"),
  "utf8"
);
const shell = readFileSync(
  resolve(__dirname, "../app/components/reports/ReportShell.tsx"),
  "utf8"
);
const insights = readFileSync(
  resolve(__dirname, "../src/reports/report-view-insights.ts"),
  "utf8"
);

describe("report detail rich UI", () => {
  it("expõe shell de KPI e insight", () => {
    expect(shell).toMatch(/export function ReportKpiStrip/);
    expect(shell).toMatch(/export function ReportInsight/);
    expect(insights).toMatch(/buildRadarInsights/);
    expect(insights).toMatch(/buildExecutiveInsights/);
  });

  it("radar, executivo e top assuntos usam o palco de apresentação", () => {
    expect(renderers).toMatch(/PresentationStage/);
    expect(renderers).toMatch(/kicker="Radar de pauta"/);
    expect(renderers).toMatch(/kicker="Resumo executivo"/);
    expect(renderers).toMatch(/kicker="Top assuntos"/);
    expect(renderers).toMatch(/kicker="Canais do YouTube"/);
    expect(renderers).toMatch(/buildRadarInsights/);
    expect(renderers).toMatch(/buildExecutiveInsights/);
    expect(renderers).toMatch(/topUp|Em alta/);
  });

  it("mapa temático nomeia as cores e lista assuntos por cluster", () => {
    expect(mapaChart).toMatch(/Legenda dos clusters/);
    expect(mapaChart).toMatch(/cluster_label/);
    expect(renderers).toMatch(/clusters\.map\(\(cluster/);
    expect(renderers).not.toMatch(/flex flex-wrap gap-2/);
  });

  it("gráfico de notícias por tag abre a lista no modal", () => {
    expect(renderers).toMatch(/TagNewsChart/);
    expect(renderers).toMatch(/dateFrom=\{periodStart\}/);
    const chart = readFileSync(
      resolve(__dirname, "../app/components/reports/TagNewsChart.tsx"),
      "utf8"
    );
    expect(chart).toMatch(/AlertDialog/);
    expect(chart).toMatch(/tagId/);
    expect(chart).toMatch(/onTagClick/);
  });

  it("volume, mapa, rankings e weekday usam insights", () => {
    expect(renderers).toMatch(/buildVolumeInsights/);
    expect(renderers).toMatch(/buildMapaInsights/);
    expect(renderers).toMatch(/buildRankingInsights/);
    expect(renderers).toMatch(/buildWeekdayInsights/);
    expect(renderers).toMatch(/buildSourceDetailInsights/);
  });

  it("month_presentation não cai em dump JSON", () => {
    expect(renderers).toMatch(/month_presentation/);
    expect(renderers).toMatch(/MonthPresentationClient/);
    const monthIdx = renderers.indexOf('type === "month_presentation"');
    const fallbackIdx = renderers.lastIndexOf("JSON.stringify");
    expect(monthIdx).toBeGreaterThan(-1);
    expect(fallbackIdx).toBeGreaterThan(monthIdx);
  });

  it("by_source_detail exibe articles_total e videos_total", () => {
    expect(renderers).toMatch(/articles_total/);
    expect(renderers).toMatch(/videos_total/);
  });
});
