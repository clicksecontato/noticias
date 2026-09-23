import { describe, expect, it } from "vitest";
import {
  sectionHeaderDescriptionClass,
  sectionHeaderTitleClass,
  type SectionHeaderLevel,
} from "../src/ui/section-header";

describe("section-header classes", () => {
  it("usa tipografia de página para level page", () => {
    expect(sectionHeaderTitleClass("page")).toContain("text-2xl");
    expect(sectionHeaderTitleClass("page")).toContain("font-semibold");
  });

  it("usa tipografia de seção para level section", () => {
    expect(sectionHeaderTitleClass("section")).toContain("text-xl");
  });

  it("descrição fica muted e legível", () => {
    const cls = sectionHeaderDescriptionClass();
    expect(cls).toContain("text-muted-foreground");
    expect(cls).toContain("text-base");
  });

  it("aceita apenas levels conhecidos", () => {
    const levels: SectionHeaderLevel[] = ["page", "section"];
    for (const level of levels) {
      expect(sectionHeaderTitleClass(level).length).toBeGreaterThan(0);
    }
  });
});
