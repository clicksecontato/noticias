import { describe, expect, it } from "vitest";
import {
  resolveThemeCluster,
  slugifySubjectKey,
} from "../src/reports/theme-cluster-strategy";
import { generateMapaTematicoReport } from "../src/reports/generators/mapa-tematico";

describe("resolveThemeCluster", () => {
  it("mapeia labs, capacidades, regulação e infra", () => {
    expect(resolveThemeCluster("openai")).toBe("labs_produtos");
    expect(resolveThemeCluster("agentes")).toBe("capacidades");
    expect(resolveThemeCluster("pl-2338")).toBe("regulacao");
    expect(resolveThemeCluster("gpu")).toBe("infra");
    expect(resolveThemeCluster("brasil")).toBe("mercado_geo");
  });

  it("usa slugify do nome quando slug ausente", () => {
    expect(resolveThemeCluster(undefined, "PL 2338")).toBe("regulacao");
    expect(slugifySubjectKey("União Europeia")).toBe("uniao-europeia");
  });

  it("retorna outros para slug desconhecido", () => {
    expect(resolveThemeCluster("assunto-inexistente")).toBe("outros");
  });
});

describe("generateMapaTematicoReport", () => {
  const rows = [
    {
      subject_id: "1",
      subject_name: "OpenAI",
      subject_slug: "openai",
      articles: 10,
      videos: 2,
      total: 12,
    },
    {
      subject_id: "2",
      subject_name: "Agentes",
      subject_slug: "agentes",
      articles: 5,
      videos: 1,
      total: 6,
    },
    {
      subject_id: "3",
      subject_name: "PL 2338",
      subject_slug: "pl-2338",
      articles: 4,
      videos: 0,
      total: 4,
    },
    {
      subject_id: "4",
      subject_name: "GPU",
      subject_slug: "gpu",
      articles: 2,
      videos: 1,
      total: 3,
    },
    {
      subject_id: "5",
      subject_name: "Tutorial",
      subject_slug: "tutorial",
      articles: 1,
      videos: 0,
      total: 1,
    },
  ];

  it("agrega por cluster e calcula share_pct", () => {
    const payload = generateMapaTematicoReport(rows, {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
    });

    expect(payload.period).toEqual({ start: "2026-09-01", end: "2026-09-07" });
    expect(payload.totals.total).toBe(26);

    const labs = payload.clusters.find((c) => c.cluster_id === "labs_produtos");
    expect(labs).toMatchObject({
      cluster_label: "Labs e produtos",
      total: 12,
      share_pct: 46.2,
    });

    const capac = payload.clusters.find((c) => c.cluster_id === "capacidades");
    expect(capac?.total).toBe(6);

    const reg = payload.clusters.find((c) => c.cluster_id === "regulacao");
    expect(reg?.total).toBe(4);

    const infra = payload.clusters.find((c) => c.cluster_id === "infra");
    expect(infra?.total).toBe(3);

    const outros = payload.clusters.find((c) => c.cluster_id === "outros");
    expect(outros?.total).toBe(1);
    expect(outros?.subjects[0].subject_slug).toBe("tutorial");
  });

  it("respeita limite de assuntos por cluster", () => {
    const labRows = [
      { subject_id: "a", subject_name: "OpenAI", subject_slug: "openai", articles: 10, videos: 0, total: 10 },
      { subject_id: "b", subject_name: "Claude", subject_slug: "claude", articles: 9, videos: 0, total: 9 },
      { subject_id: "c", subject_name: "Gemini", subject_slug: "gemini", articles: 8, videos: 0, total: 8 },
      { subject_id: "d", subject_name: "Grok", subject_slug: "grok", articles: 7, videos: 0, total: 7 },
    ];
    const payload = generateMapaTematicoReport(labRows, {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
      limit_subjects: 2,
    });
    const labs = payload.clusters.find((c) => c.cluster_id === "labs_produtos");
    expect(labs?.subjects).toHaveLength(2);
    expect(labs?.subjects[0].subject_slug).toBe("openai");
    expect(labs?.total).toBe(34);
  });

  it("omite cluster outros quando vazio", () => {
    const payload = generateMapaTematicoReport(
      [
        {
          subject_id: "1",
          subject_name: "OpenAI",
          subject_slug: "openai",
          articles: 1,
          videos: 0,
          total: 1,
        },
      ],
      { periodStart: "2026-09-01", periodEnd: "2026-09-01" }
    );
    expect(payload.clusters.some((c) => c.cluster_id === "outros")).toBe(false);
  });
});
