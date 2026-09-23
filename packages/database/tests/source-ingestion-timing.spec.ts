import { describe, expect, it } from "vitest";
import type { ContentSourceRecord } from "../src/content-source-types";

/**
 * Contrato do update de timing — testes unitários do shape sem Supabase real.
 * A implementação memory/supabase é exercitada via content-repository.
 */
describe("source ingestion timing contract", () => {
  it("ContentSourceRecord aceita campos opcionais de timing", () => {
    const record: ContentSourceRecord = {
      id: "tecnoblog",
      name: "Tecnoblog",
      language: "pt-BR",
      provider: "rss",
      rssUrl: "https://tecnoblog.net/feed/",
      channelId: null,
      isActive: true,
      lastIngestedAt: "2026-09-22T20:00:00.000Z",
      lastIngestionDurationMs: 1234
    };
    expect(record.lastIngestionDurationMs).toBe(1234);
    expect(record.lastIngestedAt).toMatch(/2026-09-22/);
  });

  it("timing é opcional em fontes ainda não ingeridas", () => {
    const record: ContentSourceRecord = {
      id: "new",
      name: "Nova",
      language: "pt-BR",
      provider: "youtube",
      channelId: "UCxxx",
      isActive: true
    };
    expect(record.lastIngestedAt).toBeUndefined();
    expect(record.lastIngestionDurationMs).toBeUndefined();
  });
});
