import { describe, expect, it } from "vitest";
import {
  backfillYoutubePublicMetadata,
  chunkVideoIds,
} from "../src/admin/youtube-metadata-backfill";
import type { YoutubePublicMetadata } from "../../../packages/scraping/src/content-sources/types";

const sample: YoutubePublicMetadata = {
  durationSeconds: 90,
  creatorTags: ["ia"],
  liveBroadcastContent: "none",
  defaultAudioLanguage: "pt",
  hasCaptions: true,
  topicCategories: [],
  youtubeCategoryId: "28",
};

describe("backfill de metadados YouTube", () => {
  it("agrupa ids em lotes de 50", () => {
    const ids = Array.from({ length: 51 }, (_, i) => `v${i}`);
    const chunks = chunkVideoIds(ids);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(50);
    expect(chunks[1]).toEqual(["v50"]);
  });

  it("atualiza só os vídeos que o YouTube devolve e ignora os ausentes", async () => {
    const saved: string[] = [];
    const fetched: string[][] = [];
    const result = await backfillYoutubePublicMetadata({
      listPending: async () => [
        { id: "row-1", videoId: "abc" },
        { id: "row-2", videoId: "gone" },
      ],
      fetchBatch: async (videoIds) => {
        fetched.push(videoIds);
        return new Map([["abc", sample]]);
      },
      save: async (id) => {
        saved.push(id);
      },
    });

    expect(fetched).toEqual([["abc", "gone"]]);
    expect(saved).toEqual(["row-1"]);
    expect(result).toEqual({ pending: 2, updated: 1, missingOnYoutube: 1 });
  });
});
