import { describe, expect, it } from "vitest";
import { buildHubPipelineStats } from "../src/hub-pipeline-stats";

describe("buildHubPipelineStats", () => {
  const generatedAt = "2026-09-23T12:00:00.000Z";

  it("agrega fontes ativas, timing e quietas", () => {
    const stats = buildHubPipelineStats({
      generatedAt,
      sources: [
        {
          provider: "rss",
          isActive: true,
          lastIngestedAt: "2026-09-23T10:00:00.000Z",
          lastIngestionDurationMs: 1000,
        },
        {
          provider: "youtube",
          isActive: true,
          lastIngestedAt: "2026-09-23T11:00:00.000Z",
          lastIngestionDurationMs: 3000,
        },
        {
          provider: "rss",
          isActive: true,
          lastIngestedAt: "2026-09-01T00:00:00.000Z",
          lastIngestionDurationMs: 500,
        },
        { provider: "rss", isActive: false, lastIngestedAt: "2026-09-23T09:00:00.000Z" },
      ],
      catalog: { subjects: 100, tags: 50, types: 8 },
      content: {
        articlesTotal: 200,
        articlesNews: 160,
        videosTotal: 50,
        videosNews: 40,
      },
      enrichment: {
        articlesWithSubject: 120,
        articlesWithTag: 80,
        videosWithSubject: 30,
        videosWithTag: 20,
      },
      recent7d: { articles: 25, videos: 10 },
    });

    expect(stats.sources.active_total).toBe(3);
    expect(stats.sources.active_rss).toBe(2);
    expect(stats.sources.active_youtube).toBe(1);
    expect(stats.sources.last_ingested_at).toBe("2026-09-23T11:00:00.000Z");
    expect(stats.sources.avg_ingestion_duration_ms).toBe(1500);
    expect(stats.sources.quiet_sources).toBe(1);

    expect(stats.content.articles_news_pct).toBe(80);
    expect(stats.content.videos_news_pct).toBe(80);

    expect(stats.enrichment.articles_with_subject_pct).toBe(75);
    expect(stats.enrichment.articles_with_tag_pct).toBe(50);
    expect(stats.enrichment.videos_with_subject_pct).toBe(75);
    expect(stats.enrichment.videos_with_tag_pct).toBe(50);

    expect(stats.recent_7d).toEqual({ articles: 25, videos: 10, total: 35 });
    expect(stats.catalog.subjects).toBe(100);
  });

  it("retorna zeros seguros quando não há dados", () => {
    const stats = buildHubPipelineStats({
      generatedAt,
      sources: [],
      catalog: { subjects: 0, tags: 0, types: 0 },
      content: {
        articlesTotal: 0,
        articlesNews: 0,
        videosTotal: 0,
        videosNews: 0,
      },
      enrichment: {
        articlesWithSubject: 0,
        articlesWithTag: 0,
        videosWithSubject: 0,
        videosWithTag: 0,
      },
      recent7d: { articles: 0, videos: 0 },
    });

    expect(stats.sources.avg_ingestion_duration_ms).toBeNull();
    expect(stats.sources.last_ingested_at).toBeNull();
    expect(stats.content.articles_news_pct).toBe(0);
    expect(stats.enrichment.articles_with_subject_pct).toBe(0);
    expect(stats.recent_7d.total).toBe(0);
  });
});
