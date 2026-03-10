import { describe, expect, it } from "vitest";
import {
  buildSitemapIndexXml,
  buildSitemapXml,
  chunkSitemapEntries
} from "../src/sitemap";

describe("SEO Agent - sitemap generation", () => {
  it("deve dividir entradas em chunks consistentes", () => {
    const entries = Array.from({ length: 7 }, (_, index) => ({
      loc: `https://site.com/page-${index + 1}`
    }));

    const chunks = chunkSitemapEntries(entries, 3);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(3);
    expect(chunks[1]).toHaveLength(3);
    expect(chunks[2]).toHaveLength(1);
  });

  it("deve usar configuracao default quando chunkSize nao for informado", () => {
    const entries = Array.from({ length: 5001 }, (_, index) => ({
      loc: `https://site.com/page-${index + 1}`
    }));

    const chunks = chunkSitemapEntries(entries);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(5000);
    expect(chunks[1]).toHaveLength(1);
  });

  it("deve gerar xml de sitemap com urlset e urls", () => {
    const xml = buildSitemapXml([
      { loc: "https://site.com/games/elden-ring", changefreq: "daily" },
      { loc: "https://site.com/news/novo-trailer", priority: 0.8 }
    ]);

    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://site.com/games/elden-ring</loc>");
    expect(xml).toContain("<loc>https://site.com/news/novo-trailer</loc>");
    expect(xml).toContain("</urlset>");
  });

  it("deve gerar sitemap index com multiplos arquivos", () => {
    const xml = buildSitemapIndexXml([
      "https://site.com/sitemaps/sitemap-games-1.xml",
      "https://site.com/sitemaps/sitemap-news-1.xml"
    ]);

    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://site.com/sitemaps/sitemap-games-1.xml</loc>");
    expect(xml).toContain("<loc>https://site.com/sitemaps/sitemap-news-1.xml</loc>");
    expect(xml).toContain("</sitemapindex>");
  });
});
