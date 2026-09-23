import { describe, expect, it } from "vitest";
import {
  areAllSourcesSelected,
  deselectAllSourceIds,
  isSourceStale,
  selectAllSourceIds,
  selectStaleSourceIds,
  STALE_AFTER_MS,
  toggleSourceId,
} from "../src/admin/source-selection";

describe("source-selection", () => {
  it("alterna inclusão e remoção de um id", () => {
    expect(toggleSourceId([], "s1")).toEqual(["s1"]);
    expect(toggleSourceId(["s1", "s2"], "s1")).toEqual(["s2"]);
    expect(toggleSourceId(["s2"], "s1").sort()).toEqual(["s1", "s2"]);
  });

  it("seleciona todos e limpa seleção", () => {
    expect(selectAllSourceIds(["a", "b", "a"])).toEqual(["a", "b"]);
    expect(deselectAllSourceIds()).toEqual([]);
  });

  it("detecta se todas estão selecionadas", () => {
    expect(areAllSourcesSelected(["a", "b"], ["a", "b"])).toBe(true);
    expect(areAllSourcesSelected(["a"], ["a", "b"])).toBe(false);
    expect(areAllSourcesSelected([], [])).toBe(false);
  });

  it("marca fonte sem ingestão ou antiga como stale", () => {
    const now = Date.parse("2026-09-23T15:00:00.000Z");
    expect(isSourceStale(undefined, now)).toBe(true);
    expect(isSourceStale("2026-09-23T10:00:00.000Z", now)).toBe(false);
    expect(
      isSourceStale(
        new Date(now - STALE_AFTER_MS - 1).toISOString(),
        now
      )
    ).toBe(true);
  });

  it("seleciona só fontes stale", () => {
    const now = Date.parse("2026-09-23T15:00:00.000Z");
    const ids = selectStaleSourceIds(
      [
        { id: "fresh", lastIngestedAt: "2026-09-23T12:00:00.000Z" },
        { id: "old", lastIngestedAt: "2026-09-20T12:00:00.000Z" },
        { id: "never", lastIngestedAt: undefined },
      ],
      now
    );
    expect(ids.sort()).toEqual(["never", "old"]);
  });
});
