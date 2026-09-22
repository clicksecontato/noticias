import { describe, expect, it } from "vitest";
import { applyMonthPresentationFilters } from "../src/reports/generators/month-presentation";

type Row = {
  id: string;
  published_at: string;
  source_id: string;
  provider: "rss" | "youtube";
};

const rows: Row[] = [
  { id: "a1", published_at: "2026-03-01T12:00:00Z", source_id: "s-rss", provider: "rss" },
  { id: "v1", published_at: "2026-03-02T12:00:00Z", source_id: "s-yt", provider: "youtube" },
  { id: "a2", published_at: "2026-03-03T12:00:00Z", source_id: "s-rss-2", provider: "rss" },
];

describe("applyMonthPresentationFilters", () => {
  it("sem filtros mantém todas as linhas", () => {
    expect(applyMonthPresentationFilters(rows, undefined)).toHaveLength(3);
    expect(applyMonthPresentationFilters(rows, {})).toHaveLength(3);
  });

  it("filtra por provedor rss", () => {
    const out = applyMonthPresentationFilters(rows, { provider: "rss" });
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.provider === "rss")).toBe(true);
  });

  it("filtra por sourceIds", () => {
    const out = applyMonthPresentationFilters(rows, { sourceIds: ["s-rss", "s-yt"] });
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.source_id).sort()).toEqual(["s-rss", "s-yt"].sort());
  });

  it("combina provedor e fontes", () => {
    const out = applyMonthPresentationFilters(rows, {
      provider: "rss",
      sourceIds: ["s-rss-2"],
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a2");
  });
});
