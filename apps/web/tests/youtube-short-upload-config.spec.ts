import { describe, expect, it } from "vitest";
import {
  getYoutubeShortUploadConfig,
  validateYoutubeShortUploadConfig,
} from "../src/youtube-shorts/youtube-short-upload-config";

describe("youtube short upload config", () => {
  it("validateYoutubeShortUploadConfig falha sem OAuth", () => {
    const err = validateYoutubeShortUploadConfig({
      clientId: "",
      clientSecret: "",
      refreshToken: "",
      ytDlpPath: "yt-dlp",
      redirectUri: "http://localhost",
    });
    expect(err).toContain("YOUTUBE_OAUTH_CLIENT_ID");
  });

  it("getYoutubeShortUploadConfig le env", () => {
    const cfg = getYoutubeShortUploadConfig({
      YOUTUBE_OAUTH_CLIENT_ID: "id",
      YOUTUBE_OAUTH_CLIENT_SECRET: "secret",
      YOUTUBE_REFRESH_TOKEN: "refresh",
      YT_DLP_PATH: "/usr/bin/yt-dlp",
      YOUTUBE_OAUTH_REDIRECT_URI: "http://127.0.0.1/oauth",
    });
    expect(cfg.clientId).toBe("id");
    expect(cfg.ytDlpPath).toBe("/usr/bin/yt-dlp");
    expect(cfg.redirectUri).toBe("http://127.0.0.1/oauth");
  });
});
