import { describe, expect, it } from "vitest";
import {
  buildVideosQueryPath,
  datesForPeriodPreset,
  parseVideosListParams,
  toggleSourceId,
} from "../src/videos-list-query";

describe("videos-list-query", () => {
  it("parseia page, múltiplos canais e datas YYYY-MM-DD", () => {
    expect(
      parseVideosListParams({
        page: "2",
        source: "canal-a,canal-b",
        from: "2026-09-01",
        to: "2026-09-24",
      })
    ).toEqual({
      page: 2,
      sourceIds: ["canal-a", "canal-b"],
      dateFrom: "2026-09-01",
      dateTo: "2026-09-24",
      period: "",
    });
  });

  it("ignora datas inválidas e page inválida", () => {
    expect(
      parseVideosListParams({ page: "0", from: "ontem", to: "2026-13-99" })
    ).toEqual({
      page: 1,
      sourceIds: [],
      dateFrom: "",
      dateTo: "",
      period: "",
    });
  });

  it("reconhece preset de período today/7d/30d/90d", () => {
    expect(parseVideosListParams({ period: "today" }).period).toBe("today");
    expect(parseVideosListParams({ period: "30d" }).period).toBe("30d");
    expect(parseVideosListParams({ period: "foo" }).period).toBe("");
  });

  it("monta path preservando filtros multi-canal", () => {
    expect(
      buildVideosQueryPath({
        page: 1,
        sourceIds: ["x", "y"],
        dateFrom: "2026-09-01",
        dateTo: "2026-09-10",
        period: "",
        basePath: "/videos",
      })
    ).toBe("/videos?page=1&source=x%2Cy&from=2026-09-01&to=2026-09-10");
  });

  it("toggleSourceId adiciona e remove canal", () => {
    expect(toggleSourceId([], "a")).toEqual(["a"]);
    expect(toggleSourceId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSourceId(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleSourceId(["a"], "")).toEqual([]);
  });

  it("preset 7d define from/to inclusivos", () => {
    const { dateFrom, dateTo } = datesForPeriodPreset(
      "7d",
      new Date("2026-09-24T15:00:00.000Z")
    );
    expect(dateTo).toBe("2026-09-24");
    expect(dateFrom).toBe("2026-09-18");
  });

  it("preset today usa o mesmo dia", () => {
    const { dateFrom, dateTo } = datesForPeriodPreset(
      "today",
      new Date("2026-09-24T15:00:00.000Z")
    );
    expect(dateFrom).toBe("2026-09-24");
    expect(dateTo).toBe("2026-09-24");
  });
});
