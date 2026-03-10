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
    expect(getRevalidateSeconds("game")).toBe(86400);
    expect(getRevalidateSeconds("best")).toBe(43200);
  });

  it("deve gerar tags de revalidacao por entidade", () => {
    const tags = buildRevalidateTags({
      pageType: "best",
      genre: "rpg",
      platform: "pc"
    });

    expect(tags).toEqual(
      expect.arrayContaining(["page:best", "genre:rpg", "platform:pc"])
    );
  });

  it("deve gerar static params a partir de slugs", () => {
    const params = generateStaticParamsFromSlugs("slug", ["elden-ring", "gta-6"]);
    expect(params).toEqual([{ slug: "elden-ring" }, { slug: "gta-6" }]);
  });

  it("deve gerar metadata no formato esperado para App Router", () => {
    const metadata = generateRouteMetadata({
      pageType: "news",
      titleBase: "Atualizacao de Elden Ring",
      descriptionBase: "Patch novo com ajustes de balanceamento.",
      canonicalPath: "/news/atualizacao-elden-ring"
    });

    expect(metadata.alternates.canonical).toBe(
      "https://www.noticiasgames.com/news/atualizacao-elden-ring"
    );
    expect(metadata.openGraph.type).toBe("article");
  });
});
