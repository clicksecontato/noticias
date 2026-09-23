import { describe, expect, it } from "vitest";
import { formatIngestionDurationMs } from "../src/ui/format-ingestion-duration";

describe("formatIngestionDurationMs", () => {
  it("mostra traço quando vazio", () => {
    expect(formatIngestionDurationMs(undefined)).toBe("—");
    expect(formatIngestionDurationMs(null)).toBe("—");
  });

  it("mostra milissegundos abaixo de 1s", () => {
    expect(formatIngestionDurationMs(450)).toBe("450 ms");
  });

  it("mostra segundos acima de 1s", () => {
    expect(formatIngestionDurationMs(1200)).toMatch(/1[,.]2 s/);
  });
});
