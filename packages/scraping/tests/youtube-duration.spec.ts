import { describe, expect, it } from "vitest";
import { parseYoutubeDurationSeconds } from "../src/fetchers/youtube-duration";

describe("parseYoutubeDurationSeconds", () => {
  it("converte horas, minutos e segundos", () => {
    expect(parseYoutubeDurationSeconds("PT1H2M3S")).toBe(3723);
    expect(parseYoutubeDurationSeconds("PT15M")).toBe(900);
    expect(parseYoutubeDurationSeconds("PT45S")).toBe(45);
    expect(parseYoutubeDurationSeconds("PT1H")).toBe(3600);
  });

  it("retorna null para valor ausente ou inválido", () => {
    expect(parseYoutubeDurationSeconds(undefined)).toBeNull();
    expect(parseYoutubeDurationSeconds("")).toBeNull();
    expect(parseYoutubeDurationSeconds("PT")).toBeNull();
    expect(parseYoutubeDurationSeconds("1:30")).toBeNull();
  });
});
