import { describe, expect, it } from "vitest";
import {
  computePreviousPeriod,
  generateRadarPautaReport,
} from "../src/reports/generators/radar-pauta";

describe("computePreviousPeriod", () => {
  it("calcula janela anterior com a mesma duração", () => {
    expect(computePreviousPeriod("2026-09-01", "2026-09-07")).toEqual({
      periodStart: "2026-08-25",
      periodEnd: "2026-08-31",
    });
  });

  it("funciona para um único dia", () => {
    expect(computePreviousPeriod("2026-09-22", "2026-09-22")).toEqual({
      periodStart: "2026-09-21",
      periodEnd: "2026-09-21",
    });
  });
});

describe("generateRadarPautaReport", () => {
  const current = [
    { subject_id: "s1", subject_name: "Agentes", articles: 8, videos: 2, total: 10 },
    { subject_id: "s2", subject_name: "ChatGPT", articles: 5, videos: 1, total: 6 },
    { subject_id: "s3", subject_name: "PL 2338", articles: 3, videos: 0, total: 3 },
  ];
  const previous = [
    { subject_id: "s1", subject_name: "Agentes", articles: 5, videos: 0, total: 5 },
    { subject_id: "s2", subject_name: "ChatGPT", articles: 10, videos: 2, total: 12 },
  ];

  it("calcula delta, variação % e tendência", () => {
    const payload = generateRadarPautaReport(current, previous, {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
      limit: 10,
    });

    expect(payload.period).toEqual({
      start: "2026-09-01",
      end: "2026-09-07",
    });
    expect(payload.previous_period).toEqual({
      start: "2026-08-25",
      end: "2026-08-31",
    });

    expect(payload.items[0]).toMatchObject({
      subject_id: "s1",
      subject_name: "Agentes",
      total: 10,
      previous_total: 5,
      delta: 5,
      delta_pct: 100,
      trend: "up",
      rank: 1,
      previous_rank: 2,
    });

    expect(payload.items[1]).toMatchObject({
      subject_id: "s2",
      trend: "down",
      delta: -6,
      delta_pct: -50,
      previous_rank: 1,
    });

    expect(payload.items[2]).toMatchObject({
      subject_id: "s3",
      previous_total: 0,
      delta: 3,
      trend: "new",
      previous_rank: null,
    });
  });

  it("respeita o limite e ordena por total atual", () => {
    const payload = generateRadarPautaReport(current, previous, {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
      limit: 1,
    });
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].subject_id).toBe("s1");
  });
});
