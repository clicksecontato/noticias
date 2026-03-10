import { describe, expect, it } from "vitest";
import { buildWebMetadata } from "../src/page-metadata";

describe("Web Application Agent - rendered metadata contract", () => {
  it("deve gerar metadata de artigo para pagina de noticia", () => {
    const metadata = buildWebMetadata({
      pageType: "news",
      titleBase: "Novo trailer de GTA 6",
      descriptionBase: "Confira os detalhes revelados no novo trailer.",
      canonicalPath: "/news/novo-trailer-de-gta-6"
    });

    expect(metadata.title).toContain("GTA 6");
    expect(metadata.description.length).toBeGreaterThanOrEqual(120);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
    expect(metadata.canonicalUrl).toBe("https://www.noticiasgames.com/news/novo-trailer-de-gta-6");
    expect(metadata.openGraph.type).toBe("article");
  });

  it("deve gerar metadata website para pagina de colecao", () => {
    const metadata = buildWebMetadata({
      pageType: "best",
      titleBase: "Melhores RPG de 2026",
      descriptionBase: "Veja uma selecao dos melhores jogos de RPG para PC.",
      canonicalPath: "/best/rpg/pc"
    });

    expect(metadata.title.toLowerCase()).toContain("rpg");
    expect(metadata.openGraph.type).toBe("website");
    expect(metadata.openGraph.url).toBe("https://www.noticiasgames.com/best/rpg/pc");
  });
});
