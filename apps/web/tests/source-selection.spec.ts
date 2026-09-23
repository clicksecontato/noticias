import { describe, expect, it } from "vitest";
import {
  areAllSourcesSelected,
  deselectAllSourceIds,
  selectAllSourceIds,
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
});
