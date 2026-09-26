import { describe, expect, it } from "vitest";
import { createYoutubeContentFetcher } from "../src/fetchers/youtube-content-fetcher";
import type { ContentSource } from "../src/content-sources/types";

function createYoutubeSource(overrides: Partial<ContentSource> = {}): ContentSource {
  return {
    id: "canal-games",
    name: "Canal Games",
    language: "pt-BR",
    provider: "youtube",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx",
    isActive: true,
    ...overrides
  };
}

const mockPlaylistItemsResponse = {
  kind: "youtube#playlistItemListResponse",
  items: [
    {
      id: "item1",
      snippet: {
        title: "Novo trailer do jogo X",
        description: "Confira o trailer mais recente.",
        publishedAt: "2026-03-10T12:00:00Z",
        resourceId: { videoId: "abc123" },
        thumbnails: {
          default: { url: "https://img.youtube.com/vi/abc123/default.jpg" },
          medium: { url: "https://img.youtube.com/vi/abc123/mqdefault.jpg" }
        }
      }
    },
    {
      id: "item2",
      snippet: {
        title: "Gameplay completo",
        description: "Uma hora de gameplay.",
        publishedAt: "2026-03-09T18:00:00Z",
        resourceId: { videoId: "def456" },
        thumbnails: { default: { url: "https://img.youtube.com/vi/def456/default.jpg" } }
      }
    }
  ]
};

describe("YouTube Content Fetcher", () => {
  it("deve rejeitar fonte que não é youtube", async () => {
    const mockFetch = async () => ({ ok: true, json: async () => ({ items: [] }) });
    const fetcher = createYoutubeContentFetcher({ apiKey: "key", fetch: mockFetch });
    const source = createYoutubeSource({ provider: "rss" as "youtube" });

    await expect(fetcher.fetch(source)).rejects.toThrow("YouTube fetcher exige provider 'youtube'");
  });

  it("deve rejeitar fonte sem channelId", async () => {
    const mockFetch = async () => ({ ok: true, json: async () => ({ items: [] }) });
    const fetcher = createYoutubeContentFetcher({ apiKey: "key", fetch: mockFetch });
    const source = createYoutubeSource({ channelId: undefined });

    await expect(fetcher.fetch(source)).rejects.toThrow("channelId é obrigatório");
  });

  it("deve buscar vídeos e mapear para FetchedContentItem", async () => {
    const capturedUrls: string[] = [];
    const mockFetch = async (url: string) => {
      capturedUrls.push(url);
      if (url.includes("/videos?")) {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: "abc123",
                snippet: {
                  tags: ["ia", "openai"],
                  categoryId: "28",
                  defaultAudioLanguage: "pt",
                  liveBroadcastContent: "none"
                },
                contentDetails: { duration: "PT12M5S", caption: "true" },
                topicDetails: {
                  topicCategories: ["https://en.wikipedia.org/wiki/Artificial_intelligence"]
                }
              }
            ]
          })
        };
      }
      return {
        ok: true,
        json: async () => ({
          ...mockPlaylistItemsResponse,
          items: mockPlaylistItemsResponse.items.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  contentDetails: { videoPublishedAt: "2026-03-10T11:00:00Z" }
                }
              : item
          )
        })
      };
    };

    const fetcher = createYoutubeContentFetcher({ apiKey: "fake-api-key", fetch: mockFetch });
    const source = createYoutubeSource({ channelId: "UCtest123" });

    const { items, stats } = await fetcher.fetch(source);

    expect(items).toHaveLength(2);
    expect(stats.youtubePlaylistItemsRaw).toBe(2);
    expect(stats.youtubeItemsDelivered).toBe(2);
    expect(items[0]).toEqual({
      externalId: "abc123",
      title: "Novo trailer do jogo X",
      description: "Confira o trailer mais recente.",
      url: "https://www.youtube.com/watch?v=abc123",
      publishedAt: "2026-03-10T11:00:00Z",
      imageUrl: "https://img.youtube.com/vi/abc123/mqdefault.jpg",
      contentType: "video",
      youtube: {
        durationSeconds: 725,
        creatorTags: ["ia", "openai"],
        liveBroadcastContent: "none",
        defaultAudioLanguage: "pt",
        hasCaptions: true,
        topicCategories: ["https://en.wikipedia.org/wiki/Artificial_intelligence"],
        youtubeCategoryId: "28"
      }
    });
    expect(items[1].externalId).toBe("def456");
    expect(items[1].youtube?.durationSeconds).toBeNull();
    expect(items[1].youtube?.hasCaptions).toBeNull();
    expect(capturedUrls[0]).toContain("playlistId=UUtest123");
    expect(capturedUrls[0]).toContain("part=snippet%2CcontentDetails");
    expect(capturedUrls[1]).toContain("/videos?");
    expect(capturedUrls[1]).toContain("id=abc123%2Cdef456");
    expect(capturedUrls.some((url) => url.includes("fake-api-key"))).toBe(true);
  });

  it("deve retornar array vazio quando a API retorna sem items", async () => {
    const mockFetch = async () => ({
      ok: true,
      json: async () => ({ kind: "youtube#playlistItemListResponse", items: [] })
    });
    const fetcher = createYoutubeContentFetcher({ apiKey: "key", fetch: mockFetch });
    const source = createYoutubeSource();

    const { items } = await fetcher.fetch(source);

    expect(items).toEqual([]);
  });

  it("deve lançar quando a API retorna erro", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: "Quota exceeded" } })
    });
    const fetcher = createYoutubeContentFetcher({ apiKey: "key", fetch: mockFetch });
    const source = createYoutubeSource();

    await expect(fetcher.fetch(source)).rejects.toThrow(/403|Quota|failed/i);
  });
});
