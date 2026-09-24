import { describe, expect, it } from "vitest";
import {
  pickYoutubeChannelThumbnailUrl,
  type YoutubeChannelSnippetThumbnails,
} from "../src/admin/youtube-channel-avatar";

describe("pickYoutubeChannelThumbnailUrl", () => {
  it("prefere high > medium > default", () => {
    const thumbs: YoutubeChannelSnippetThumbnails = {
      default: { url: "https://yt.example/default.jpg" },
      medium: { url: "https://yt.example/medium.jpg" },
      high: { url: "https://yt.example/high.jpg" },
    };
    expect(pickYoutubeChannelThumbnailUrl(thumbs)).toBe(
      "https://yt.example/high.jpg"
    );
  });

  it("usa medium se high ausente", () => {
    expect(
      pickYoutubeChannelThumbnailUrl({
        default: { url: "https://yt.example/default.jpg" },
        medium: { url: "https://yt.example/medium.jpg" },
      })
    ).toBe("https://yt.example/medium.jpg");
  });

  it("retorna null sem thumbnails", () => {
    expect(pickYoutubeChannelThumbnailUrl(undefined)).toBeNull();
    expect(pickYoutubeChannelThumbnailUrl({})).toBeNull();
  });
});

describe("fetchYoutubeChannelProfile", () => {
  it("lê snippet.thumbnails.high do channels.list", async () => {
    const { fetchYoutubeChannelProfile } = await import(
      "../src/admin/youtube-channel-avatar"
    );
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "UCxxxxxxxxxxxxxxxxxxxxxx",
              snippet: {
                title: "Canal Teste",
                thumbnails: {
                  high: { url: "https://yt.example/high.jpg" },
                },
              },
            },
          ],
        }),
        { status: 200 }
      );

    const profile = await fetchYoutubeChannelProfile(
      "fake-key",
      "UCxxxxxxxxxxxxxxxxxxxxxx",
      fetchImpl as typeof fetch
    );
    expect(profile).toEqual({
      channelId: "UCxxxxxxxxxxxxxxxxxxxxxx",
      imageUrl: "https://yt.example/high.jpg",
      title: "Canal Teste",
    });
  });
});
