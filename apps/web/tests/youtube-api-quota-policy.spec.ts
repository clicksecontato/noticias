import { describe, expect, it } from "vitest";
import {
  YOUTUBE_API_DAILY_QUOTA_DEFAULT,
  YOUTUBE_API_METHOD_CATALOG,
  getYoutubeApiMethodUnits,
  youtubeQuotaDayKey,
  buildYoutubeQuotaSummary,
} from "../src/admin/youtube-api-quota-policy";

describe("youtube-api-quota-policy", () => {
  it("define custos clássicos dos métodos que usamos", () => {
    expect(getYoutubeApiMethodUnits("channels.list")).toBe(1);
    expect(getYoutubeApiMethodUnits("playlistItems.list")).toBe(1);
    expect(getYoutubeApiMethodUnits("videos.list")).toBe(1);
    expect(getYoutubeApiMethodUnits("search.list")).toBe(100);
    expect(getYoutubeApiMethodUnits("videos.insert")).toBe(1600);
  });

  it("catálogo lista só métodos usados no produto", () => {
    const methods = YOUTUBE_API_METHOD_CATALOG.map((m) => m.method);
    expect(methods).toEqual([
      "channels.list",
      "playlistItems.list",
      "search.list",
      "videos.list",
      "videos.insert",
    ]);
  });

  it("quota day key usa calendário Pacific Time", () => {
    // 2026-09-24 02:00 UTC = ainda 23/09 em PT (UTC-7 no PDT)
    const key = youtubeQuotaDayKey(new Date("2026-09-24T02:00:00.000Z"));
    expect(key).toBe("2026-09-23");
  });

  it("summary agrega uso do dia e calcula restante", () => {
    const summary = buildYoutubeQuotaSummary({
      dailyLimit: YOUTUBE_API_DAILY_QUOTA_DEFAULT,
      quotaDay: "2026-09-24",
      events: [
        { method: "playlistItems.list", units: 1, context: "ingest:abc" },
        { method: "playlistItems.list", units: 1, context: "ingest:def" },
        { method: "search.list", units: 100, context: "resolve-handle" },
        { method: "channels.list", units: 1, context: "avatar" },
      ],
    });
    expect(summary.unitsUsed).toBe(103);
    expect(summary.unitsRemaining).toBe(YOUTUBE_API_DAILY_QUOTA_DEFAULT - 103);
    expect(summary.byMethod.find((m) => m.method === "search.list")?.calls).toBe(1);
    expect(summary.byMethod.find((m) => m.method === "playlistItems.list")?.calls).toBe(2);
  });
});
