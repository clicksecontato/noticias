import { describe, expect, it } from "vitest";
import {
  runManualNewsIngestion,
  type FetchNewsBySource,
  type SourceInput
} from "../src/ingestion-orchestrator";

const SOURCES: SourceInput[] = [
  { id: "s1", name: "Canal BR", language: "pt-BR", rssUrl: "https://a.com/rss" },
  { id: "s2", name: "Canal EN", language: "en-US", rssUrl: "https://b.com/rss" }
];

describe("Scraping Agent - manual ingestion orchestrator", () => {
  it("deve processar somente fontes selecionadas e ativas em portugues", async () => {
    const fetchNewsBySource: FetchNewsBySource = async (source) => [
      {
        sourceId: source.id,
        title: `Noticia ${source.id}`,
        content: "Conteudo de teste",
        language: source.language
      }
    ];

    const result = await runManualNewsIngestion({
      availableSources: SOURCES,
      selectedSourceIds: ["s1", "s2"],
      fetchNewsBySource
    });

    expect(result.processedSourceIds).toEqual(["s1"]);
    expect(result.createdArticles).toBe(1);
    expect(result.discardedByLanguage).toBe(0);
  });

  it("deve descartar itens fora de pt-BR", async () => {
    const fetchNewsBySource: FetchNewsBySource = async (source) => [
      {
        sourceId: source.id,
        title: "English title",
        content: "English body",
        language: "en-US"
      }
    ];

    const result = await runManualNewsIngestion({
      availableSources: [SOURCES[0]],
      selectedSourceIds: ["s1"],
      fetchNewsBySource
    });

    expect(result.createdArticles).toBe(0);
    expect(result.discardedByLanguage).toBe(1);
  });

  it("deve descartar item invalido com erro 404/not found", async () => {
    const fetchNewsBySource: FetchNewsBySource = async () => [
      {
        sourceId: "s1",
        title: "404 - Nao encontrado",
        content: "Page not found",
        language: "pt-BR"
      }
    ];

    const result = await runManualNewsIngestion({
      availableSources: [SOURCES[0]],
      selectedSourceIds: ["s1"],
      fetchNewsBySource
    });

    expect(result.createdArticles).toBe(0);
    expect(result.discardedByLanguage).toBe(0);
    expect(result.discardedByValidation).toBe(1);
  });
});
