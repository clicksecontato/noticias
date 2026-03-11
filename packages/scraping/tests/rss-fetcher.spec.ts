import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRssItemsBySource } from "../src/rss-fetcher";

const SOURCE = {
  id: "flowgames",
  name: "Flow Games",
  language: "pt-BR",
  rssUrl: "https://flowgames.gg/rss"
};

describe("Scraping Agent - rss fetcher (agregador)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna itens com titulo, descricao e link do feed (sem buscar pagina)", async () => {
    const rssXml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[Titulo da Noticia]]></title>
          <description><![CDATA[Resumo curto do artigo para o hub.]]></description>
          <link>https://flowgames.gg/noticia-1</link>
        </item>
      </channel></rss>`;

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(rssXml, { status: 200 }));

    const items = await fetchRssItemsBySource(SOURCE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Titulo da Noticia");
    expect(items[0].sourceUrl).toBe("https://flowgames.gg/noticia-1");
    expect(items[0].content).toContain("Resumo curto");
  });

  it("nao inclui itens sem link", async () => {
    const rssXml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[Noticia sem link]]></title>
          <description><![CDATA[Descricao qualquer]]></description>
        </item>
      </channel></rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(rssXml, { status: 200 }));

    const items = await fetchRssItemsBySource(SOURCE);

    expect(items).toHaveLength(0);
  });

  it("usa descricao do RSS como conteudo (resumo para o hub)", async () => {
    const rssXml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[Outra noticia]]></title>
          <description><![CDATA[Texto da descricao para exibir no agregador.]]></description>
          <link>https://flowgames.gg/outra</link>
        </item>
      </channel></rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(rssXml, { status: 200 }));

    const items = await fetchRssItemsBySource(SOURCE);

    expect(items[0].content).toBe("Texto da descricao para exibir no agregador.");
  });
});
