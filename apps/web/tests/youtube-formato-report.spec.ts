import { describe, expect, it } from "vitest";
import { generateYoutubeFormatoReport } from "../src/reports/generators/youtube-formato";

describe("generateYoutubeFormatoReport", () => {
  it("resume duração, idioma, legenda, tags e tópicos", () => {
    const payload = generateYoutubeFormatoReport([
      {
        durationSeconds: 45,
        defaultAudioLanguage: "pt-BR",
        liveBroadcastContent: "none",
        hasCaptions: true,
        creatorTags: ["OpenAI", "agentes"],
        topicCategories: ["https://en.wikipedia.org/wiki/Artificial_intelligence"],
        youtubeCategoryId: "28",
      },
      {
        durationSeconds: 3600,
        defaultAudioLanguage: "en",
        liveBroadcastContent: "live",
        hasCaptions: false,
        creatorTags: ["OpenAI"],
        topicCategories: ["https://en.wikipedia.org/wiki/Artificial_intelligence"],
        youtubeCategoryId: "27",
      },
    ]);

    expect(payload.videos_total).toBe(2);
    expect(payload.hours_total).toBe(1);
    expect(payload.pct_portuguese).toBe(50);
    expect(payload.pct_captions).toBe(50);
    expect(payload.duration_bands.find((b) => b.key === "short")?.count).toBe(1);
    expect(payload.duration_bands.find((b) => b.key === "long")?.count).toBe(1);
    expect(payload.languages.find((l) => l.key === "pt")?.count).toBe(1);
    expect(payload.broadcast.find((b) => b.key === "live")?.count).toBe(1);
    expect(payload.creator_tags[0]).toEqual({ key: "OpenAI", label: "OpenAI", count: 2 });
    expect(payload.topics[0]?.label).toBe("Artificial intelligence");
    expect(payload.categories[0]?.category_id).toBe("28");
    expect(payload.categories.find((row) => row.category_id === "28")?.label).toBe(
      "Ciência e tecnologia"
    );
  });
});
