import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = (...p: string[]) => resolve(__dirname, ...p);

describe("chip/badge arredondados", () => {
  it("Badge usa rounded-full (Tailwind 3; sem rounded-4xl)", () => {
    const badge = readFileSync(root("../components/ui/badge.tsx"), "utf8");
    expect(badge).not.toMatch(/rounded-4xl/);
    expect(badge).toMatch(/rounded-full/);
  });

  it("FilterChipRow e EntityChips usam chips altos e tipografia legível", () => {
    const filter = readFileSync(root("../app/components/FilterChipRow.tsx"), "utf8");
    const entity = readFileSync(root("../app/components/EntityChips.tsx"), "utf8");
    expect(filter).toMatch(/rounded-full/);
    expect(filter).toMatch(/h-8|min-h-8/);
    expect(entity).toMatch(/rounded-full/);
    expect(entity).toMatch(/leading-none|leading-tight/);
  });
});
