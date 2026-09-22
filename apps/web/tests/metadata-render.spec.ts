import { describe, expect, it } from "vitest";
import { buildWebMetadata } from "../src/page-metadata";

describe("Web Application Agent - rendered metadata contract", () => {
  it("deve gerar metadata de artigo para pagina de noticia", () => {
    const metadata = buildWebMetadata({
      pageType: "news",
      titleBase: "OpenAI lanca atualizacao do ChatGPT",
      descriptionBase: "Confira os novos recursos anunciados para o assistente e a API.",
      canonicalPath: "/news/openai-lanca-atualizacao-chatgpt"
    });

    expect(metadata.title).toContain("ChatGPT");
    expect(metadata.description.length).toBeGreaterThanOrEqual(120);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
    expect(metadata.canonicalUrl).toBe(
      "https://www.noticiasgames.com/news/openai-lanca-atualizacao-chatgpt"
    );
    expect(metadata.openGraph.type).toBe("article");
  });

  it("deve gerar metadata website para pagina de colecao", () => {
    const metadata = buildWebMetadata({
      pageType: "best",
      titleBase: "Melhores LLM de 2026",
      descriptionBase: "Veja uma selecao dos melhores assuntos de LLM.",
      canonicalPath: "/best/llm"
    });

    expect(metadata.title.toLowerCase()).toContain("llm");
    expect(metadata.openGraph.type).toBe("website");
    expect(metadata.openGraph.url).toBe("https://www.noticiasgames.com/best/llm");
  });
});
