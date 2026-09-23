import { describe, expect, it } from "vitest";
import {
  buildSourceFreshnessBars,
  buildSourceHealthSlices,
} from "../src/admin/source-status-chart";

const NOW = Date.parse("2026-09-23T18:00:00.000Z");

describe("source-status-chart", () => {
  it("monta fatias Ok vs Atrasada", () => {
    const slices = buildSourceHealthSlices(
      [
        { id: "a", name: "A", lastIngestedAt: "2026-09-23T12:00:00.000Z" },
        { id: "b", name: "B", lastIngestedAt: "2026-09-20T12:00:00.000Z" },
        { id: "c", name: "C" },
      ],
      NOW
    );
    expect(slices).toEqual([
      { key: "ok", label: "Em dia", value: 1, color: "#d4a574" },
      { key: "stale", label: "Atrasada", value: 2, color: "#c4784a" },
    ]);
  });

  it("ordena barras de frescor pela idade", () => {
    const bars = buildSourceFreshnessBars(
      [
        { id: "fresh", name: "Fresh", lastIngestedAt: "2026-09-23T16:00:00.000Z" },
        { id: "old", name: "Old", lastIngestedAt: "2026-09-22T18:00:00.000Z" },
      ],
      NOW
    );
    expect(bars[0]?.id).toBe("old");
    expect(bars[0]?.hoursAgo).toBe(24);
    expect(bars[1]?.hoursAgo).toBe(2);
    expect(bars[1]?.stale).toBe(false);
  });
});
