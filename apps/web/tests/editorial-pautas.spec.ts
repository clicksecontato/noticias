import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildByTypesPayload,
  buildEmPortuguesPayload,
  buildPerspectivasPayload,
} from "../src/reports/generators/editorial-pautas";

const perspectivasView = readFileSync(
  resolve(__dirname, "../app/components/reports/EditorialPautaViews.tsx"),
  "utf8"
);

describe("pautas editoriais novas", () => {
  it("lista assuntos cobertos por mais de uma fonte", () => {
    const payload = buildPerspectivasPayload(
      [
        {
          subject_id: "agentes",
          subject_name: "Agentes",
          source_id: "s1",
          source_name: "Canal A",
          provider: "youtube",
          count: 4,
        },
        {
          subject_id: "agentes",
          subject_name: "Agentes",
          source_id: "s2",
          source_name: "Blog B",
          provider: "rss",
          count: 2,
        },
        {
          subject_id: "solo",
          subject_name: "Só um canal",
          source_id: "s1",
          source_name: "Canal A",
          provider: "youtube",
          count: 9,
        },
      ],
      { periodStart: "2026-03-01", periodEnd: "2026-03-07" }
    );

    expect(payload.subjects.map((subject) => subject.subject_name)).toEqual(["Agentes"]);
    expect(payload.subjects[0]).toMatchObject({
      sources_total: 2,
      videos: 4,
      articles: 2,
    });
    expect(payload.subjects[0]?.sources.map((source) => source.source_name)).toEqual([
      "Canal A",
      "Blog B",
    ]);
  });

  it("separa vídeos em português por canal e assunto", () => {
    const payload = buildEmPortuguesPayload({
      videos: [
        { id: "v1", source_id: "s1", language: "pt-BR" },
        { id: "v2", source_id: "s1", language: "en" },
        { id: "v3", source_id: "s2", language: "pt" },
      ],
      subjects: [
        { video_id: "v1", subject_id: "sub", subject_name: "ChatGPT" },
        { video_id: "v2", subject_id: "sub", subject_name: "ChatGPT" },
        { video_id: "v3", subject_id: "outro", subject_name: "Agentes" },
      ],
      sourceNames: new Map([
        ["s1", "Canal PT"],
        ["s2", "Outro canal"],
      ]),
    });

    expect(payload.videos_total).toBe(3);
    expect(payload.portuguese_total).toBe(2);
    expect(payload.pct_portuguese).toBe(67);
    expect(payload.channels[0]).toMatchObject({ source_name: "Canal PT", portuguese: 1 });
    expect(payload.subjects.map((subject) => subject.subject_name).sort()).toEqual([
      "Agentes",
      "ChatGPT",
    ]);
    expect(payload.subjects.find((subject) => subject.subject_name === "ChatGPT")?.videos).toBe(1);
  });

  it("ordena tipos pelo volume de vídeos", () => {
    const payload = buildByTypesPayload([
      { type_id: "t1", type_name: "Tutorial", articles: 1, videos: 2 },
      { type_id: "t2", type_name: "Lançamento", articles: 8, videos: 5 },
    ]);
    expect(payload.items.map((item) => item.type_name)).toEqual(["Lançamento", "Tutorial"]);
    expect(payload.items[0]?.total).toBe(13);
  });

  it("abre os vídeos contados com título, thumb e link", () => {
    const view = perspectivasView.slice(
      perspectivasView.indexOf("function PerspectivasVideoDialog"),
      perspectivasView.indexOf("export function EmPortuguesView")
    );
    expect(view).toMatch(/AlertDialog/);
    expect(view).toMatch(/subjectId/);
    expect(view).toMatch(/thumbnailUrl/);
    expect(view).toMatch(/video\.url/);
    expect(view).toMatch(/no-underline/);
  });
});
