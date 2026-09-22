import { describe, expect, it } from "vitest";
import {
  buildRevalidateTags,
  generateRouteMetadata,
  generateStaticParamsFromSlugs,
  getRevalidateSeconds
} from "../src/publishing";

describe("Web Application Agent - publishing strategy", () => {
  it("deve aplicar ISR curto para noticias e longo para paginas estaveis", () => {
    expect(getRevalidateSeconds("news")).toBe(900);
    expect(getRevalidateSeconds("subject")).toBe(86400);
    expect(getRevalidateSeconds("best")).toBe(43200);
  });

  it("deve gerar tags de revalidacao por entidade", () => {
    const tags = buildRevalidateTags({
      pageType: "best",
      type: "llm"
    });

    expect(tags).toEqual(
      expect.arrayContaining(["page:best", "type:llm"])
    );
  });

  it("deve gerar static params a partir de slugs", () => {
    const params = generateStaticParamsFromSlugs("slug", ["chatgpt", "claude"]);
    expect(params).toEqual([{ slug: "chatgpt" }, { slug: "claude" }]);
  });

  it("deve gerar metadata no formato esperado para App Router", () => {
    const metadata = generateRouteMetadata({
      pageType: "news",
      titleBase: "Atualizacao de ChatGPT",
      descriptionBase: "Nova versao com ajustes de desempenho e API.",
      canonicalPath: "/news/anthropic-atualiza-claude"
    });

    expect(metadata.alternates.canonical).toBe(
      "https://www.noticiasgames.com/news/anthropic-atualiza-claude"
    );
    expect(metadata.openGraph.type).toBe("article");
  });
});
