import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbSchema,
  buildNewsSchema,
  buildSubjectSchema
} from "../src/schema";

describe("SEO Agent - schema.org generation", () => {
  it("deve gerar schema Thing valido para assunto", () => {
    const schema = buildSubjectSchema({
      name: "ChatGPT",
      description: "Assistente conversacional de IA.",
      url: "https://site.com/subjects/chatgpt"
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Thing");
    expect(schema.name).toBe("ChatGPT");
    expect(schema.url).toBe("https://site.com/subjects/chatgpt");
  });

  it("deve gerar schema NewsArticle valido", () => {
    const schema = buildNewsSchema({
      headline: "Novo trailer de GTA 6",
      description: "Confira os principais detalhes revelados.",
      datePublished: "2026-03-10T12:00:00.000Z",
      authorName: "Redacao",
      url: "https://site.com/news/openai-lanca-atualizacao-chatgpt"
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
      { name: "Assuntos", item: "https://site.com/subjects" },
      { name: "ChatGPT", item: "https://site.com/subjects/chatgpt" }
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
