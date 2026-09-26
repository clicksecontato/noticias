import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildMonthVideoChartSlides } from "../src/reports/month-presentation-video-slides";

const client = readFileSync(
  resolve(__dirname, "../app/admin/month-presentation/MonthPresentationClient.tsx"),
  "utf8"
);
const chart = readFileSync(
  resolve(__dirname, "../app/components/reports/VideoSliceChart.tsx"),
  "utf8"
);
const videosRoute = readFileSync(resolve(__dirname, "../app/api/admin/videos/route.ts"), "utf8");
const repository = readFileSync(resolve(__dirname, "../src/admin/videos-repository.ts"), "utf8");
const generator = readFileSync(
  resolve(__dirname, "../src/reports/generators/month-presentation.ts"),
  "utf8"
);

describe("slides de vídeo da apresentação mensal", () => {
  it("inclui tags, formato do YouTube, assuntos e tópicos", () => {
    const slides = buildMonthVideoChartSlides({
      tags: [{ id: "tag-1", name: "agentes", count: 4 }],
      subjects: [{ id: "sub-1", name: "OpenAI", count: 3 }],
      formato: {
        videos_total: 2,
        hours_total: 1,
        pct_portuguese: 50,
        pct_captions: 50,
        duration_bands: [{ key: "short", label: "Até 1 min", count: 2, hours: 0.1 }],
        languages: [{ key: "pt", label: "Português", count: 1 }],
        broadcast: [{ key: "none", label: "Gravado", count: 2 }],
        captions: { yes: 1, no: 1, unknown: 0 },
        creator_tags: [{ key: "llm", label: "llm", count: 2 }],
        topics: [{ key: "Inteligência artificial", label: "Inteligência artificial", count: 2 }],
        categories: [{ category_id: "28", label: "Ciência e tecnologia", count: 2 }],
      },
    });
    expect(slides.map((slide) => slide.title)).toEqual([
      "Tags",
      "Duração",
      "Idioma do áudio",
      "Transmissão",
      "Categoria YouTube",
      "Tags do criador",
      "Assuntos",
      "Tópicos do YouTube",
    ]);
    expect(slides[0]?.param).toBe("tagId");
    expect(slides[0]?.rows[0]).toEqual({ key: "tag-1", label: "agentes", count: 4 });
    expect(slides.find((slide) => slide.title === "Duração")?.param).toBe("durationBand");
    expect(slides.find((slide) => slide.title === "Categoria YouTube")?.rows[0]?.key).toBe("28");
    expect(slides.find((slide) => slide.title === "Assuntos")?.param).toBe("subjectId");
    expect(slides.find((slide) => slide.title === "Tópicos do YouTube")?.param).toBe("topic");
  });

  it("omite barras sem vídeos", () => {
    const slides = buildMonthVideoChartSlides({
      tags: [{ id: "tag-1", name: "vazio", count: 0 }],
      formato: null,
    });
    expect(slides).toEqual([]);
  });
});

describe("modal de vídeos na apresentação mensal", () => {
  it("abre os vídeos da barra e leva ao vídeo no admin", () => {
    expect(client).toMatch(/buildMonthVideoChartSlides/);
    expect(client).toMatch(/VideoSliceChart/);
    expect(chart).toMatch(/\/api\/admin\/videos/);
    expect(chart).toMatch(/\/admin\/videos\/\$\{video\.id\}/);
    expect(chart).toMatch(/AlertDialog/);
    expect(chart).toMatch(/no-underline/);
  });

  it("lista vídeos pelo recorte clicado", () => {
    for (const param of ["tagId", "subjectId", "creatorTag", "topic", "durationBand", "language", "categoryId", "broadcast"]) {
      expect(videosRoute).toContain(param);
      expect(repository).toContain(param);
    }
    expect(generator).toMatch(/video_tags/);
    expect(generator).toMatch(/video_subjects/);
  });
});
