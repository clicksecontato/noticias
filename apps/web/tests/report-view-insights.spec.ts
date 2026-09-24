import { describe, expect, it } from "vitest";
import {
  buildRankingInsights,
  buildRadarInsights,
  buildVolumeInsights,
  buildWeekdayInsights,
  buildMapaInsights,
  buildExecutiveInsights,
  buildSourceDetailInsights,
} from "../src/reports/report-view-insights";

describe("report-view-insights", () => {
  it("radar: conta tendências e destaca top altas/quedas", () => {
    const result = buildRadarInsights([
      {
        subject_name: "A",
        delta: 10,
        delta_pct: 50,
        trend: "up",
        total: 20,
        previous_total: 10,
      },
      {
        subject_name: "B",
        delta: -5,
        delta_pct: -40,
        trend: "down",
        total: 8,
        previous_total: 13,
      },
      {
        subject_name: "C",
        delta: 3,
        delta_pct: null,
        trend: "new",
        total: 3,
        previous_total: 0,
      },
      {
        subject_name: "D",
        delta: 0,
        delta_pct: 0,
        trend: "stable",
        total: 5,
        previous_total: 5,
      },
    ]);
    expect(result.kpis.map((k) => k.value)).toEqual(["1", "1", "1", "1"]);
    expect(result.topUp[0]?.subject_name).toBe("A");
    expect(result.topDown[0]?.subject_name).toBe("B");
    expect(result.insight).toMatch(/1 assunto novo/i);
  });

  it("volume: calcula totais e pico", () => {
    const result = buildVolumeInsights(
      [
        { date: "2026-01-01", articles: 2, videos: 1 },
        { date: "2026-01-02", articles: 10, videos: 5 },
        { date: "2026-01-03", articles: 1, videos: 0 },
      ],
      { articles: 13, videos: 6 }
    );
    expect(result.kpis[0]?.value).toBe("13");
    expect(result.kpis[1]?.value).toBe("6");
    expect(result.peak?.date).toBe("2026-01-02");
    expect(result.insight).toMatch(/2026-01-02/);
  });

  it("ranking: líder e concentração top 5", () => {
    const result = buildRankingInsights(
      [
        { name: "Alpha", total: 40 },
        { name: "Beta", total: 30 },
        { name: "Gama", total: 20 },
        { name: "Delta", total: 5 },
        { name: "Eps", total: 5 },
      ],
      "fonte"
    );
    expect(result.leaderName).toBe("Alpha");
    expect(result.leaderSharePct).toBe(40);
    expect(result.top5SharePct).toBe(100);
    expect(result.insight).toMatch(/Alpha/);
  });

  it("weekday: identifica pico e vale", () => {
    const result = buildWeekdayInsights([
      { label: "Dom", total: 1 },
      { label: "Seg", total: 10 },
      { label: "Ter", total: 3 },
    ]);
    expect(result.peakLabel).toBe("Seg");
    expect(result.lowLabel).toBe("Dom");
    expect(result.insight).toMatch(/Seg/);
  });

  it("mapa: cluster dominante e concentração", () => {
    const result = buildMapaInsights(
      [
        { cluster_label: "Labs", total: 60, share_pct: 60 },
        { cluster_label: "Regulação", total: 40, share_pct: 40 },
      ],
      { articles: 50, videos: 50, total: 100 }
    );
    expect(result.dominantLabel).toBe("Labs");
    expect(result.insight).toMatch(/Labs/);
  });

  it("executive: compara ritmo 7d vs 30d", () => {
    const result = buildExecutiveInsights({
      last7: { articles: 14, videos: 7, rssPct: 60, youtubePct: 40 },
      last30: { articles: 30, videos: 30, rssPct: 50, youtubePct: 50 },
      last90: { articles: 90, videos: 90, rssPct: 55, youtubePct: 45 },
    });
    expect(result.kpis.length).toBeGreaterThanOrEqual(3);
    expect(result.insight).toMatch(/7 dias|ritmo/i);
  });

  it("by_source_detail: usa totais e tag líder", () => {
    const result = buildSourceDetailInsights({
      articles_total: 12,
      videos_total: 3,
      tags: [
        { tag_name: "LLM", count: 8 },
        { tag_name: "API", count: 2 },
      ],
    });
    expect(result.kpis[0]?.value).toBe("12");
    expect(result.leaderTag).toBe("LLM");
    expect(result.insight).toMatch(/LLM/);
  });
});
