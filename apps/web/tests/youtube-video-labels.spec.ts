import { describe, expect, it } from "vitest";
import {
  formatCaptionFlag,
  formatDurationSeconds,
  formatLiveBroadcast,
  formatTopicCategory,
  formatYoutubeCategory,
} from "../src/admin/youtube-video-labels";

describe("youtube video labels", () => {
  it("formata duração, transmissão, categoria, legenda e tópico", () => {
    expect(formatDurationSeconds(3723)).toBe("1h 2min");
    expect(formatDurationSeconds(90)).toBe("1min 30s");
    expect(formatDurationSeconds(null)).toBe("—");
    expect(formatLiveBroadcast("live")).toBe("Ao vivo");
    expect(formatLiveBroadcast("none")).toBe("Gravado");
    expect(formatYoutubeCategory("28")).toBe("Ciência e tecnologia");
    expect(formatYoutubeCategory("20")).toBe("Jogos");
    expect(formatYoutubeCategory("22")).toBe("Pessoas e blogs");
    expect(formatYoutubeCategory("26")).toBe("Como fazer e estilo");
    expect(formatCaptionFlag(true)).toBe("Sim");
    expect(formatCaptionFlag(false)).toBe("Não");
    expect(formatTopicCategory("https://en.wikipedia.org/wiki/Artificial_intelligence")).toBe(
      "Artificial intelligence"
    );
  });
});
