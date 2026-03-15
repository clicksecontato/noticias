import { describe, expect, it } from "vitest";
import { createYoutubeContentPersister } from "../src/persisters/youtube-content-persister";
import type { ContentSource, FetchedContentItem } from "../src/content-sources/types";

const youtubeSource: ContentSource = {
  id: "yt-source",
  name: "Canal Games",
  language: "pt-BR",
  provider: "youtube",
  channelId: "UCxxx",
  isActive: true
};

const items: FetchedContentItem[] = [
  {
    externalId: "abc123",
    title: "Trailer do jogo",
    description: "Descricao do video",
    url: "https://www.youtube.com/watch?v=abc123",
    publishedAt: "2026-03-10T12:00:00Z",
    imageUrl: "https://img.youtube.com/vi/abc123/mqdefault.jpg",
    contentType: "video"
  }
];

describe("YouTube Content Persister", () => {
  it("rejeita fonte que não é youtube", async () => {
    const persister = createYoutubeContentPersister({
      saveYoutubeVideos: async () => ({ created: 0, skipped: 0, skippedItems: [] })
    });
    const rssSource = { ...youtubeSource, provider: "rss" as const };

    await expect(persister.persist(rssSource, items)).rejects.toThrow(/youtube/);
  });

  it("mapeia itens para YoutubeVideoInput e chama saveYoutubeVideos", async () => {
    let capturedSourceId = "";
    let capturedItems: Array<{ videoId: string; title: string; url: string; thumbnailUrl?: string | null }> = [];
    const persister = createYoutubeContentPersister({
      saveYoutubeVideos: async (sourceId, input) => {
        capturedSourceId = sourceId;
        capturedItems = input;
        return { created: 1, skipped: 0, skippedItems: [] };
      }
    });

    const result = await persister.persist(youtubeSource, items);

    expect(capturedSourceId).toBe("yt-source");
    expect(capturedItems).toHaveLength(1);
    expect(capturedItems[0]).toEqual({
      videoId: "abc123",
      title: "Trailer do jogo",
      description: "Descricao do video",
      url: "https://www.youtube.com/watch?v=abc123",
      publishedAt: "2026-03-10T12:00:00Z",
      thumbnailUrl: "https://img.youtube.com/vi/abc123/mqdefault.jpg"
    });
    expect(result).toEqual({ created: 1, skipped: 0, skippedItems: [] });
  });
});
