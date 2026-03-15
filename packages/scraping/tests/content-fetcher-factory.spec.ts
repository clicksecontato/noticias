import { describe, expect, it } from "vitest";
import { createContentFetcher } from "../src/fetchers/content-fetcher-factory";
import type { ContentSourceProvider } from "../src/content-sources/types";

describe("Content Fetcher Factory", () => {
  it("deve retornar fetcher RSS quando provider é rss", () => {
    const fetcher = createContentFetcher("rss", {});
    expect(fetcher).toBeDefined();
    expect(typeof fetcher.fetch).toBe("function");
  });

  it("deve retornar fetcher YouTube quando provider é youtube", () => {
    const fetcher = createContentFetcher("youtube", {
      youtube: { apiKey: "fake-key" }
    });
    expect(fetcher).toBeDefined();
    expect(typeof fetcher.fetch).toBe("function");
  });

  it("fetcher rss deve rejeitar fonte youtube", async () => {
    const fetcher = createContentFetcher("rss", {});
    const youtubeSource = {
      id: "yt1",
      name: "Canal",
      language: "pt-BR",
      provider: "youtube" as ContentSourceProvider,
      channelId: "UCxxx",
      isActive: true
    };
    await expect(fetcher.fetch(youtubeSource)).rejects.toThrow(/rss|youtube/i);
  });

  it("fetcher youtube deve rejeitar fonte rss", async () => {
    const mockFetch = async () => ({ ok: true, json: async () => ({ items: [] }) });
    const fetcher = createContentFetcher("youtube", {
      youtube: { apiKey: "key", fetch: mockFetch }
    });
    const rssSource = {
      id: "s1",
      name: "RSS",
      language: "pt-BR",
      provider: "rss" as ContentSourceProvider,
      rssUrl: "https://a.com/feed",
      isActive: true
    };
    await expect(fetcher.fetch(rssSource)).rejects.toThrow(/youtube|rss/i);
  });
});
