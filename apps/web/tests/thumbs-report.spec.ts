import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildThumbsPayload } from "../src/reports/generators/thumbs";

const view = readFileSync(
  resolve(__dirname, "../app/components/reports/ThumbsReportView.tsx"),
  "utf8"
);
const meta = readFileSync(resolve(__dirname, "../src/reports/report-type-meta.ts"), "utf8");
const runReport = readFileSync(resolve(__dirname, "../src/reports/run-report.ts"), "utf8");
const repo = readFileSync(
  resolve(__dirname, "../../../packages/database/src/report-repository.ts"),
  "utf8"
);

describe("análise de thumbs", () => {
  it("agrupa por canal, do mais recente para o mais antigo, com a thumb em alta", () => {
    const payload = buildThumbsPayload(
      [
        {
          id: "old",
          video_id: "vidOld",
          title: "Antigo",
          thumbnail_url: null,
          published_at: "2026-03-01T00:00:00Z",
          source_id: "s1",
        },
        {
          id: "new",
          video_id: "vidNew",
          title: "Novo",
          thumbnail_url: "https://stored.example/mq.jpg",
          published_at: "2026-03-10T00:00:00Z",
          source_id: "s1",
        },
        {
          id: "other",
          video_id: "vidOther",
          title: "Outro canal",
          thumbnail_url: null,
          published_at: "2026-03-05T00:00:00Z",
          source_id: "s2",
        },
        {
          id: "blank",
          video_id: null,
          title: "Sem imagem",
          thumbnail_url: "  ",
          published_at: "2026-03-12T00:00:00Z",
          source_id: "s2",
        },
      ],
      new Map([
        ["s1", "Canal Um"],
        ["s2", "Canal Dois"],
      ])
    );

    expect(payload.channels.map((channel) => channel.source_id)).toEqual(["s1", "s2"]);
    expect(payload.channels[0]?.videos.map((video) => video.title)).toEqual(["Novo", "Antigo"]);
    expect(payload.channels[0]?.videos[0]?.thumbnail_url).toBe(
      "https://i.ytimg.com/vi/vidNew/hqdefault.jpg"
    );
    expect(payload.channels[1]?.videos).toHaveLength(1);
    expect(payload.channels[1]?.source_name).toBe("Canal Dois");
  });
});

describe("apresentação da análise de thumbs", () => {
  it("mostra uma thumb por canal e todas as thumbs do canal escolhido", () => {
    expect(view).toMatch(/Slide title="Uma thumb por canal"/);
    expect(view).toMatch(/Slide title="Thumbs do canal"/);
    expect(view).toMatch(/Select/);
    expect(view).toMatch(/\/admin\/videos\/\$\{/);
    expect(view).toMatch(/theme-scrollbar/);
    expect(meta).toMatch(/thumb_analysis/);
    expect(runReport).toMatch(/thumb_analysis/);
    expect(repo).toMatch(/thumbnail_url/);
    expect(repo).toMatch(/video_id/);
  });
});
