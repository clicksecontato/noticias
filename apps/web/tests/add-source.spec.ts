import { describe, expect, it } from "vitest";
import {
  buildAddSourceRequestBody,
  EMPTY_ADD_SOURCE_FORM,
} from "../src/admin/add-source";

describe("buildAddSourceRequestBody", () => {
  it("rejeita RSS sem id ou sem url", () => {
    expect(
      buildAddSourceRequestBody({
        ...EMPTY_ADD_SOURCE_FORM,
        name: "Tecnoblog",
        provider: "rss",
        rss_url: "https://tecnoblog.net/feed/",
      }).ok
    ).toBe(false);

    expect(
      buildAddSourceRequestBody({
        ...EMPTY_ADD_SOURCE_FORM,
        id: "tecnoblog",
        name: "Tecnoblog",
        provider: "rss",
      }).ok
    ).toBe(false);
  });

  it("monta body RSS válido", () => {
    const result = buildAddSourceRequestBody({
      ...EMPTY_ADD_SOURCE_FORM,
      id: "tecnoblog",
      name: "Tecnoblog",
      provider: "rss",
      rss_url: "https://tecnoblog.net/feed/",
      language: "pt-BR",
    });
    expect(result).toEqual({
      ok: true,
      body: {
        id: "tecnoblog",
        name: "Tecnoblog",
        language: "pt-BR",
        provider: "rss",
        rss_url: "https://tecnoblog.net/feed/",
      },
    });
  });

  it("rejeita YouTube sem canal", () => {
    const result = buildAddSourceRequestBody({
      ...EMPTY_ADD_SOURCE_FORM,
      name: "Canal IA",
      provider: "youtube",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/canal/i);
    }
  });

  it("monta body YouTube com id opcional", () => {
    const result = buildAddSourceRequestBody({
      ...EMPTY_ADD_SOURCE_FORM,
      name: "Canal IA",
      provider: "youtube",
      channel_id: "https://www.youtube.com/@CanalIA",
    });
    expect(result).toEqual({
      ok: true,
      body: {
        id: "",
        name: "Canal IA",
        language: "pt-BR",
        provider: "youtube",
        channel_id: "https://www.youtube.com/@CanalIA",
      },
    });
  });
});
