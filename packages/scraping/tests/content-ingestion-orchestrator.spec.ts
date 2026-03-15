import { describe, expect, it } from "vitest";
import { runContentIngestion } from "../src/content-ingestion-orchestrator";
import type { ContentSource, FetchedContentItem } from "../src/content-sources/types";
import type { IContentFetcher } from "../src/fetchers/content-fetcher.interface";
import type { IContentPersister } from "../src/persisters/content-persister.interface";

const rssSource: ContentSource = {
  id: "s1",
  name: "RSS",
  language: "pt-BR",
  provider: "rss",
  rssUrl: "https://a.com/feed",
  isActive: true
};

const youtubeSource: ContentSource = {
  id: "yt1",
  name: "YouTube",
  language: "pt-BR",
  provider: "youtube",
  channelId: "UCxxx",
  isActive: true
};

function stubFetcher(items: FetchedContentItem[]): IContentFetcher {
  return { fetch: async () => items };
}

function stubPersister(created: number, skipped: number): IContentPersister {
  return {
    persist: async () => ({
      created,
      skipped,
      skippedItems: []
    })
  };
}

describe("Content Ingestion Orchestrator", () => {
  it("processa uma fonte e agrega resultado", async () => {
    const result = await runContentIngestion([rssSource], {
      getFetcher: () => stubFetcher([{ externalId: "1", title: "A", description: "d", url: "u", publishedAt: "2026-01-01", contentType: "article" }]),
      getPersister: () => stubPersister(1, 0)
    });

    expect(result.processedSourceIds).toEqual(["s1"]);
    expect(result.resultsBySource.s1).toEqual({ created: 1, skipped: 0, skippedItems: [] });
    expect(result.totalCreated).toBe(1);
    expect(result.totalSkipped).toBe(0);
    expect(Object.keys(result.failedSources)).toHaveLength(0);
  });

  it("processa múltiplas fontes (rss + youtube) e soma totais", async () => {
    const result = await runContentIngestion([rssSource, youtubeSource], {
      getFetcher: () => stubFetcher([]),
      getPersister: (provider) =>
        provider === "rss" ? stubPersister(2, 1) : stubPersister(3, 0)
    });

    expect(result.processedSourceIds).toEqual(["s1", "yt1"]);
    expect(result.resultsBySource.s1).toEqual({ created: 2, skipped: 1, skippedItems: [] });
    expect(result.resultsBySource.yt1).toEqual({ created: 3, skipped: 0, skippedItems: [] });
    expect(result.totalCreated).toBe(5);
    expect(result.totalSkipped).toBe(1);
  });

  it("registra falha em failedSources quando fetcher lança", async () => {
    const result = await runContentIngestion([rssSource], {
      getFetcher: () => ({ fetch: async () => { throw new Error("RSS fetch failed"); } }),
      getPersister: () => stubPersister(0, 0)
    });

    expect(result.processedSourceIds).toEqual([]);
    expect(result.failedSources.s1).toBe("RSS fetch failed");
    expect(result.totalCreated).toBe(0);
    expect(result.totalSkipped).toBe(0);
  });

  it("registra falha quando persister lança", async () => {
    const result = await runContentIngestion([rssSource], {
      getFetcher: () => stubFetcher([]),
      getPersister: () => ({
        persist: async () => { throw new Error("DB error"); }
      })
    });

    expect(result.failedSources.s1).toBe("DB error");
    expect(result.totalCreated).toBe(0);
  });
});
