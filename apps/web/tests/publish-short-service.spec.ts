import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishYoutubeShort } from "../src/youtube-shorts/publish-short-service";
import type { YoutubeShortPublishRepository } from "../../../packages/database/src/youtube-short-publish-repository";

describe("publishYoutubeShort", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("falha com pipeline desligado", async () => {
    vi.stubEnv("YOUTUBE_SHORTS_REUPLOAD_ENABLED", "false");
    const repo: YoutubeShortPublishRepository = {
      createJob: vi.fn().mockResolvedValue("job-1"),
      updateJob: vi.fn().mockResolvedValue(undefined),
      getJobById: vi.fn().mockResolvedValue(null),
    };
    const result = await publishYoutubeShort(
      { sourceUrl: "https://www.youtube.com/shorts/abcdefghijk" },
      {
        repository: repo,
        getSnapshot: vi.fn().mockResolvedValue({
          videoId: "abcdefghijk",
          title: "T",
          description: "",
          channelTitle: "Ch",
          canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
        }),
      }
    );
    expect(result.status).toBe("failed");
    expect(result.message).toContain("desabilitado");
  });

  it("completa com deps mockadas quando pipeline ligado", async () => {
    vi.stubEnv("YOUTUBE_SHORTS_REUPLOAD_ENABLED", "true");
    const repo: YoutubeShortPublishRepository = {
      createJob: vi.fn().mockResolvedValue("job-xyz"),
      updateJob: vi.fn().mockResolvedValue(undefined),
      getJobById: vi.fn().mockResolvedValue(null),
    };
    const result = await publishYoutubeShort(
      { sourceUrl: "https://youtu.be/abcdefghijk" },
      {
        repository: repo,
        getSnapshot: vi.fn().mockResolvedValue({
          videoId: "abcdefghijk",
          title: "Título",
          description: "Desc",
          channelTitle: "Canal",
          canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
        }),
        download: vi.fn().mockResolvedValue("/tmp/fake.mp4"),
        upload: vi.fn().mockResolvedValue({
          videoId: "NEW12345678",
          watchUrl: "https://www.youtube.com/watch?v=NEW12345678",
        }),
        getUploadConfig: vi.fn().mockReturnValue({
          clientId: "id",
          clientSecret: "secret",
          refreshToken: "refresh",
          redirectUri: "http://localhost",
          ytDlpPath: "yt-dlp",
          maxDownloadBytes: 500 * 1024 * 1024,
        }),
      }
    );
    expect(result.status).toBe("completed");
    expect(result.targetVideoId).toBe("NEW12345678");
    expect(result.targetVideoUrl).toContain("NEW12345678");
    expect(repo.updateJob).toHaveBeenCalled();
  });

  it("falha com pipeline ligado e OAuth inválido (sem deps)", async () => {
    vi.stubEnv("YOUTUBE_SHORTS_REUPLOAD_ENABLED", "true");
    const repo: YoutubeShortPublishRepository = {
      createJob: vi.fn().mockResolvedValue("job-2"),
      updateJob: vi.fn().mockResolvedValue(undefined),
      getJobById: vi.fn().mockResolvedValue(null),
    };
    const result = await publishYoutubeShort(
      { sourceUrl: "https://www.youtube.com/shorts/abcdefghijk" },
      {
        repository: repo,
        getSnapshot: vi.fn().mockResolvedValue({
          videoId: "abcdefghijk",
          title: "T",
          description: "",
          channelTitle: "Ch",
          canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
        }),
        getUploadConfig: vi.fn().mockReturnValue({
          clientId: "",
          clientSecret: "",
          refreshToken: "",
          redirectUri: "http://localhost",
          ytDlpPath: "yt-dlp",
          maxDownloadBytes: 500 * 1024 * 1024,
        }),
      }
    );
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("YOUTUBE_OAUTH_CLIENT_ID");
  });
});
