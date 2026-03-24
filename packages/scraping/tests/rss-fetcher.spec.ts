import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRssItemsBySource, parseRssPubDateToMillis } from "../src/rss-fetcher";

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

  it("parseRssPubDateToMillis entende pubDate em português (UOL)", () => {
    const ms = parseRssPubDateToMillis("Sex, 13 Mar 2026 17:19:24 -0300");
    expect(ms).toBeDefined();
    expect(new Date(ms!).getUTCFullYear()).toBe(2026);
  });

  it("parseRssPubDateToMillis entende mês Out (outubro)", () => {
    const ms = parseRssPubDateToMillis("Seg, 27 Out 2025 17:41:29 -0300");
    expect(ms).toBeDefined();
    expect(new Date(ms!).getUTCMonth()).toBe(9);
  });

  it("filtra itens fora da janela de 7 dias e respeita maxItems", async () => {
    const fixedNow = new Date("2026-03-23T15:00:00.000Z");
    const rssXml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[Recente]]></title>
          <description><![CDATA[Ok]]></description>
          <link>https://flowgames.gg/recente</link>
          <pubDate>Sex, 21 Mar 2026 10:00:00 -0300</pubDate>
        </item>
        <item>
          <title><![CDATA[Antiga]]></title>
          <description><![CDATA[Fora]]></description>
          <link>https://flowgames.gg/antiga</link>
          <pubDate>Sab, 01 Mar 2026 10:00:00 -0300</pubDate>
        </item>
        <item>
          <title><![CDATA[Mais recente]]></title>
          <description><![CDATA[Ok2]]></description>
          <link>https://flowgames.gg/mais-recente</link>
          <pubDate>Sex, 22 Mar 2026 10:00:00 -0300</pubDate>
        </item>
      </channel></rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(rssXml, { status: 200 }));

    const { items } = await fetchRssItemsBySource(SOURCE, {
      now: fixedNow,
      maxAgeDays: 7,
      maxItems: 1
    });

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Recente");
    expect(items[0].publishedAt).toMatch(/^2026-03-21/);
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

    const { items, stats } = await fetchRssItemsBySource(SOURCE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(1);
    expect(stats.rssItemsWithTitle).toBe(1);
    expect(stats.rssItemsDelivered).toBe(1);
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

    const { items } = await fetchRssItemsBySource(SOURCE);

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

    const { items } = await fetchRssItemsBySource(SOURCE);

    expect(items[0].content).toBe("Texto da descricao para exibir no agregador.");
  });

  it("parseia link dentro de CDATA (estilo UOL Jogos / rss.uol.com.br)", async () => {
    const uolStyleXml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title><![CDATA[Título do game]]></title>
    <link><![CDATA[https://www.uol.com.br/tilt/noticias/redacao/2026/03/13/exemplo.htm]]></link>
    <description><![CDATA[<img src='https://conteudo.imguol.com.br/c/x.jpg' align="left" /> Resumo da matéria.]]></description>
  </item>
</channel></rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(uolStyleXml, { status: 200 }));

    const { items } = await fetchRssItemsBySource(SOURCE);

    expect(items).toHaveLength(1);
    expect(items[0].sourceUrl).toBe(
      "https://www.uol.com.br/tilt/noticias/redacao/2026/03/13/exemplo.htm"
    );
    expect(items[0].imageUrl).toBe("https://conteudo.imguol.com.br/c/x.jpg");
    expect(items[0].content).toContain("Resumo da matéria");
  });

  it("parseia feed no estilo IGN Brasil (channel com link + item com link e description com entidades)", async () => {
    const ignStyleXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>IGN Brasil</title><link>https://br.ign.com</link><language>pt-br</language>
<item><title>Galaxy S25 Ultra com preço de Black Friday</title><link>https://br.ign.com/descontos/151455/news/galaxy-s25-ultra</link><description>&lt;img src="https://sm.ign.com/thumb.png" /&gt;
Oferta da Semana do Consumidor reduz o preço</description></item></channel></rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(ignStyleXml, { status: 200 }));

    const { items } = await fetchRssItemsBySource(SOURCE);

    expect(items).toHaveLength(1);
    expect(items[0].title).toContain("Galaxy S25");
    expect(items[0].sourceUrl).toBe("https://br.ign.com/descontos/151455/news/galaxy-s25-ultra");
    expect(items[0].content).toContain("Oferta da Semana do Consumidor");
  });
});
