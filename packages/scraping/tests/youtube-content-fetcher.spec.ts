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
    let capturedUrl = "";
    const mockFetch = async (url: string) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => mockPlaylistItemsResponse
      };
    };

    const fetcher = createYoutubeContentFetcher({ apiKey: "fake-api-key", fetch: mockFetch });
    const source = createYoutubeSource({ channelId: "UCtest123" });

    const items = await fetcher.fetch(source);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      externalId: "abc123",
      title: "Novo trailer do jogo X",
      description: "Confira o trailer mais recente.",
      url: "https://www.youtube.com/watch?v=abc123",
      publishedAt: "2026-03-10T12:00:00Z",
      imageUrl: "https://img.youtube.com/vi/abc123/mqdefault.jpg",
      contentType: "video"
    });
    expect(items[1].externalId).toBe("def456");
    expect(items[1].title).toBe("Gameplay completo");
    expect(items[1].contentType).toBe("video");
    expect(capturedUrl).toContain("playlistId=UUtest123");
    expect(capturedUrl).toContain("fake-api-key");
  });

  it("deve retornar array vazio quando a API retorna sem items", async () => {
    const mockFetch = async () => ({
      ok: true,
      json: async () => ({ kind: "youtube#playlistItemListResponse", items: [] })
    });
    const fetcher = createYoutubeContentFetcher({ apiKey: "key", fetch: mockFetch });
    const source = createYoutubeSource();

    const items = await fetcher.fetch(source);

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
