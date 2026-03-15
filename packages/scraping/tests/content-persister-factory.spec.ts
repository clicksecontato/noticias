import { describe, expect, it } from "vitest";
import { createContentPersister } from "../src/persisters/content-persister-factory";

const noopArticle = async () => ({ created: 0, skipped: 0, skippedItems: [] });
const noopYoutube = async () => ({ created: 0, skipped: 0, skippedItems: [] });

describe("Content Persister Factory", () => {
  it("retorna persister de artigos para provider rss", () => {
    const persister = createContentPersister("rss", {
      article: { saveIngestedNewsItems: noopArticle }
    });
    expect(persister).toBeDefined();
    expect(typeof persister.persist).toBe("function");
  });

  it("retorna persister YouTube para provider youtube", () => {
    const persister = createContentPersister("youtube", {
      youtube: { saveYoutubeVideos: noopYoutube }
    });
    expect(persister).toBeDefined();
    expect(typeof persister.persist).toBe("function");
  });

  it("lança quando rss é pedido sem deps.article", () => {
    expect(() => createContentPersister("rss", {})).toThrow(/saveIngestedNewsItems/);
  });

  it("lança quando youtube é pedido sem deps.youtube", () => {
    expect(() => createContentPersister("youtube", {})).toThrow(/saveYoutubeVideos/);
  });
});
