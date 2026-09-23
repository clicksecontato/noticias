import { describe, expect, it } from "vitest";
import {
  parsePautaFilter,
  parseWithoutSubject,
  pautaFilterToIsNews,
} from "../src/admin/list-filters";

describe("list-filters", () => {
  it("parseia filtro de pauta", () => {
    expect(parsePautaFilter("1")).toBe("in");
    expect(parsePautaFilter("out")).toBe("out");
    expect(parsePautaFilter("")).toBe("all");
    expect(pautaFilterToIsNews("in")).toBe(true);
    expect(pautaFilterToIsNews("out")).toBe(false);
    expect(pautaFilterToIsNews("all")).toBeUndefined();
  });

  it("parseia sem assunto", () => {
    expect(parseWithoutSubject("1")).toBe(true);
    expect(parseWithoutSubject("0")).toBe(false);
    expect(parseWithoutSubject(undefined)).toBe(false);
  });
});
