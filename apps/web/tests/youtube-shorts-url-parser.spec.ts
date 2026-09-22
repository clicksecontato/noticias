import { describe, expect, it } from "vitest";
import { parseYoutubeVideoInput } from "../src/youtube-shorts/url-parser";

describe("Youtube Shorts URL parser", () => {
  it("deve aceitar URL shorts", () => {
    const parsed = parseYoutubeVideoInput("https://www.youtube.com/shorts/abc123XYZ09");
    expect(parsed.videoId).toBe("abc123XYZ09");
    expect(parsed.canonicalUrl).toBe("https://www.youtube.com/watch?v=abc123XYZ09");
  });

  it("deve aceitar URL watch", () => {
    const parsed = parseYoutubeVideoInput("https://www.youtube.com/watch?v=abc123XYZ09");
    expect(parsed.videoId).toBe("abc123XYZ09");
  });

  it("deve aceitar URL curta youtu.be", () => {
    const parsed = parseYoutubeVideoInput("https://youtu.be/abc123XYZ09?t=2");
    expect(parsed.videoId).toBe("abc123XYZ09");
  });

  it("deve falhar para URL invalida", () => {
    expect(() => parseYoutubeVideoInput("not-a-url")).toThrow(
      "URL do YouTube inválida."
    );
  });

  it("deve falhar quando nao houver videoId", () => {
    expect(() => parseYoutubeVideoInput("https://www.youtube.com/watch?x=1")).toThrow(
      "Não foi possível identificar o videoId."
    );
  });
});
