import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbSchema,
  buildGameSchema,
  buildNewsSchema
} from "../src/schema";

describe("SEO Agent - schema.org generation", () => {
  it("deve gerar schema VideoGame valido", () => {
    const schema = buildGameSchema({
      name: "Elden Ring",
      description: "RPG de acao em mundo aberto.",
      genre: "RPG",
      platform: "PC",
      url: "https://site.com/games/elden-ring"
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("VideoGame");
    expect(schema.name).toBe("Elden Ring");
    expect(schema.genre).toBe("RPG");
    expect(schema.url).toBe("https://site.com/games/elden-ring");
  });

  it("deve gerar schema NewsArticle valido", () => {
    const schema = buildNewsSchema({
      headline: "Novo trailer de GTA 6",
      description: "Confira os principais detalhes revelados.",
      datePublished: "2026-03-10T12:00:00.000Z",
      authorName: "Redacao",
      url: "https://site.com/news/novo-trailer-de-gta-6"
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("NewsArticle");
    expect(schema.headline).toContain("GTA 6");
    expect(schema.author).toEqual(
      expect.objectContaining({
        "@type": "Person",
        name: "Redacao"
      })
    );
  });

  it("deve gerar breadcrumb list com posicoes ordenadas", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", item: "https://site.com" },
      { name: "Games", item: "https://site.com/games" },
      { name: "Elden Ring", item: "https://site.com/games/elden-ring" }
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: 1 }),
        expect.objectContaining({ position: 2 }),
        expect.objectContaining({ position: 3 })
      ])
    );
  });
});
