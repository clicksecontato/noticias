import type { RawNewsItem, SourceInput } from "./ingestion-orchestrator";
import type { IngestionFetchStats } from "./content-sources/types";

const MS_PER_DAY = 86_400_000;
const DEFAULT_RSS_MAX_AGE_DAYS = 7;
const DEFAULT_RSS_MAX_ITEMS = 500;

interface ParsedRssEntry {
  title: string;
  description: string;
  link: string;
  /** Optional image URL from enclosure, media:content or first img in description. */
  imageUrl?: string;
  /** Epoch ms from &lt;pubDate&gt;, quando parseável. */
  publishedMs?: number;
}

const DEFAULT_FETCH_OPTIONS: RequestInit = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; NoticiasIABot/1.0; +https://github.com/noticias-ia)",
    Accept: "application/rss+xml, application/xml, text/xml, */*"
  }
};

/** Normaliza URL: remove ponto final do hostname para evitar ERR_TLS_CERT_ALTNAME_INVALID. */
function normalizeRssUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.endsWith(".")) {
      parsed.hostname = parsed.hostname.slice(0, -1);
      return parsed.toString();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function cleanXmlValue(value: string): string {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function htmlToText(html: string): string {
  const decoded = decodeHtmlEntities(html);
  return decoded
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValue(block: string, tagName: string): string {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? cleanXmlValue(match[1]) : "";
}

/** Extrai o link do item (RSS <link>url</link>). Suporta URL em uma linha ou com quebras. */
function extractItemLink(block: string): string {
  const rssStyle = block.match(/<link\s*>[\s\n]*(https?:\/\/[^\s<]+)[\s\n]*<\/link>/i);
  if (rssStyle) return rssStyle[1].trim();
  const anyLink = block.match(/<link\s*>([\s\S]*?)<\/link>/i);
  if (anyLink) {
    return cleanXmlValue(anyLink[1].replace(/\s+/g, " "));
  }
  return extractTagValue(block, "link").trim();
}

/** Extrai URL de imagem: enclosure (type image/*), media:content ou primeira img na descrição. */
function extractImageUrl(block: string, descriptionHtml: string): string | undefined {
  const enclosureMatch = block.match(
    /<enclosure\s[^>]*\burl=["'](https?:\/\/[^"']+)["'][^>]*\btype=["']image\/[^"']+["']/i
  );
  if (enclosureMatch) return enclosureMatch[1].trim();

  // Muitos feeds colocam vídeo em <media:content> e a miniatura em <media:thumbnail>.
  // Preferimos sempre o thumbnail quando existir.
  const mediaThumbnailMatch = block.match(
    /<media:thumbnail\s[^>]*\burl=["'](https?:\/\/[^"']+)["']/i
  );
  if (mediaThumbnailMatch) return mediaThumbnailMatch[1].trim();

  const mediaContentMatch = block.match(
    /<media:content\s[^>]*\burl=["'](https?:\/\/[^"']+)["'][^>]*>/i
  );
  if (mediaContentMatch) {
    const mediaTag = mediaContentMatch[0];
    const mediaUrl = mediaContentMatch[1].trim();
    const typeMatch = mediaTag.match(/\btype=["']([^"']+)["']/i);
    const type = typeMatch?.[1]?.toLowerCase();

    // Se o feed declarar o MIME type, só aceita image/*
    if (type) {
      if (type.startsWith("image/")) return mediaUrl;
      // video/*, audio/*, etc: não é capa.
    } else {
      // Sem type: heurística pelo path (evita .mp4 etc).
      try {
        const pathname = new URL(mediaUrl).pathname.toLowerCase();
        if (/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(pathname)) return mediaUrl;
      } catch {
        // Ignora URL inválida
      }
    }
  }

  const imgMatch = descriptionHtml.match(/<img\s[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/i);
  if (imgMatch) return imgMatch[1].trim();

  return undefined;
}

/** Meses abreviados em feeds BR (RFC822 em português) → abreviação aceita por Date.parse. */
function normalizePortugueseRssMonthTokens(s: string): string {
  const map: Record<string, string> = {
    jan: "Jan",
    fev: "Feb",
    abr: "Apr",
    mai: "May",
    jun: "Jun",
    jul: "Jul",
    ago: "Aug",
    set: "Sep",
    out: "Oct",
    nov: "Nov",
    dez: "Dec"
  };
  return s.replace(/\b(jan|fev|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi, (token) => {
    const key = token.toLowerCase();
    return map[key] ?? token;
  });
}

/**
 * Converte &lt;pubDate&gt; (RFC 822, às vezes com dia da semana em PT) para epoch ms.
 */
export function parseRssPubDateToMillis(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  let s = trimmed.replace(/^[A-Za-zÀ-ÿ\u00c0-\u024f]{2,12},\s*/u, "");
  s = normalizePortugueseRssMonthTokens(s);
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : undefined;
}

function resolveRssWindowDays(options?: FetchRssOptions): number | null {
  if (options?.maxAgeDays === false) return null;
  const n = options?.maxAgeDays;
  if (n === undefined) return DEFAULT_RSS_MAX_AGE_DAYS;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return Math.floor(n);
  return DEFAULT_RSS_MAX_AGE_DAYS;
}

function resolveRssMaxItems(options?: FetchRssOptions): number {
  const n = options?.maxItems;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 2000);
  return DEFAULT_RSS_MAX_ITEMS;
}

interface RssParseStats {
  itemsWithTitle: number;
  itemsFilteredByDate: number;
  itemsCappedByMaxItems: number;
}

function parseRssEntries(xml: string, options?: FetchRssOptions): {
  entries: ParsedRssEntry[];
  stats: RssParseStats;
} {
  const nowMs = (options?.now ?? new Date()).getTime();
  const windowDays = resolveRssWindowDays(options);
  const maxItems = resolveRssMaxItems(options);
  const cutoffMs = windowDays != null ? nowMs - windowDays * MS_PER_DAY : null;

  let itemsWithTitle = 0;
  let itemsFilteredByDate = 0;
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  const entries: ParsedRssEntry[] = [];
  let itemMatch = itemRegex.exec(xml);

  while (itemMatch) {
    const block = itemMatch[1];
    const title = extractTagValue(block, "title");
    const descriptionRaw = extractTagValue(block, "description");
    const description = htmlToText(descriptionRaw);
    const link = extractItemLink(block);
    const imageUrl = extractImageUrl(block, descriptionRaw);
    const pubDateRaw = extractTagValue(block, "pubDate");
    const publishedMs = parseRssPubDateToMillis(pubDateRaw);

    if (title) {
      itemsWithTitle += 1;
      if (cutoffMs != null && publishedMs != null && publishedMs < cutoffMs) {
        itemsFilteredByDate += 1;
        itemMatch = itemRegex.exec(xml);
        continue;
      }

      entries.push({
        title,
        description,
        link,
        ...(imageUrl && { imageUrl }),
        ...(publishedMs != null && { publishedMs })
      });
    }

    itemMatch = itemRegex.exec(xml);
  }

  const beforeCap = entries.length;
  const sliced = entries.slice(0, maxItems);
  const itemsCappedByMaxItems = Math.max(0, beforeCap - sliced.length);

  return {
    entries: sliced,
    stats: { itemsWithTitle, itemsFilteredByDate, itemsCappedByMaxItems }
  };
}

export interface RssFetchResult {
  items: RawNewsItem[];
  stats: IngestionFetchStats;
}

export interface FetchRssOptions {
  fetch?: typeof globalThis.fetch;
  /**
   * Janela rolante: mantém itens com pubDate dentro dos últimos N dias.
   * `false` desliga o filtro. Padrão: 7 dias.
   */
  maxAgeDays?: number | false;
  /** Teto após filtrar (padrão 500, máximo absoluto 2000). */
  maxItems?: number;
  /** Relógio injetável (testes). */
  now?: Date;
}

/**
 * Agregador: só título, descrição (resumo) e link para o site de origem.
 * Não busca a página do artigo nem armazena conteúdo completo.
 */
export async function fetchRssItemsBySource(
  source: SourceInput,
  options?: FetchRssOptions
): Promise<RssFetchResult> {
  const fetchFn = options?.fetch ?? fetch;
  const feedUrl = normalizeRssUrl(source.rssUrl);
  const response = await fetchFn(feedUrl, DEFAULT_FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(
      `RSS fetch failed for ${source.id}: ${response.status} ${response.statusText} (${feedUrl})`
    );
  }
  const xml = await response.text();
  const { entries, stats: parseStats } = parseRssEntries(xml, options);
  const items: RawNewsItem[] = [];
  let rssItemsDroppedNoLink = 0;

  for (const entry of entries) {
    if (!entry.link) {
      rssItemsDroppedNoLink += 1;
      continue;
    }

    const content = entry.description || entry.title;
    items.push({
      sourceId: source.id,
      title: entry.title,
      content,
      language: source.language,
      sourceUrl: entry.link,
      ...(entry.imageUrl && { imageUrl: entry.imageUrl }),
      ...(entry.publishedMs != null && {
        publishedAt: new Date(entry.publishedMs).toISOString()
      })
    });
  }

  const stats: IngestionFetchStats = {
    provider: "rss",
    rssItemsWithTitle: parseStats.itemsWithTitle,
    rssItemsFilteredByDate: parseStats.itemsFilteredByDate,
    rssItemsDroppedNoLink,
    rssItemsCappedByMaxItems: parseStats.itemsCappedByMaxItems,
    rssItemsDelivered: items.length
  };

  if (typeof process !== "undefined" && !process.env.VITEST) {
    console.log(
      JSON.stringify({
        event: "ingestion.rss.fetch",
        sourceId: source.id,
        feedUrl,
        ...stats
      })
    );
  }

  return { items, stats };
}
