import { describe, expect, it } from "vitest";
import { buildNewsRelevancePayload } from "../src/reports/generators/month-presentation";

describe("buildNewsRelevancePayload", () => {
  it("agrega RSS, YouTube, combinado e por fonte", () => {
    const sourcesById = new Map([
      ["s1", { id: "s1", name: "Fonte A", provider: "rss" as const }],
      ["s2", { id: "s2", name: "Canal B", provider: "youtube" as const }],
    ]);
    const rows = [
      {
        id: "a1",
        published_at: "2026-01-01T00:00:00.000Z",
        source_id: "s1",
        provider: "rss" as const,
        is_news: true,
      },
      {
        id: "a2",
        published_at: "2026-01-02T00:00:00.000Z",
        source_id: "s1",
        provider: "rss" as const,
        is_news: false,
      },
      {
        id: "v1",
        published_at: "2026-01-03T00:00:00.000Z",
        source_id: "s2",
        provider: "youtube" as const,
        is_news: true,
      },
    ];
    const out = buildNewsRelevancePayload(rows, sourcesById);
    expect(out.articles).toEqual({
      total: 2,
      subjects_context: 1,
      generic: 1,
      pct_subjects: 50,
    });
    expect(out.videos).toEqual({
      total: 1,
      subjects_context: 1,
      generic: 0,
      pct_subjects: 100,
    });
    expect(out.combined).toEqual({
      total: 3,
      subjects_context: 2,
      generic: 1,
      pct_subjects: 67,
    });
    const s1 = out.by_source.find((b) => b.source_id === "s1");
    expect(s1).toMatchObject({
      source_name: "Fonte A",
      total: 2,
      subjects_context: 1,
      generic: 1,
      pct_subjects: 50,
    });
    const s2 = out.by_source.find((b) => b.source_id === "s2");
    expect(s2?.pct_subjects).toBe(100);
  });

  it("inclui linha agregada para artigos RSS sem fonte vinculada", () => {
    const sourcesById = new Map<string, { id: string; name: string; provider: "rss" | "youtube" | null }>();
    const rows = [
      {
        id: "a1",
        published_at: "2026-01-01T00:00:00.000Z",
        source_id: null,
        provider: "rss" as const,
        is_news: false,
      },
    ];
    const out = buildNewsRelevancePayload(rows, sourcesById);
    expect(out.articles.total).toBe(1);
    expect(out.by_source.some((b) => b.source_id === "__unmapped_articles__")).toBe(true);
    const unmapped = out.by_source.find((b) => b.source_id === "__unmapped_articles__");
    expect(unmapped?.total).toBe(1);
    expect(unmapped?.pct_subjects).toBe(0);
  });
});
