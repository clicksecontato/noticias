import type { RawNewsItem, SourceInput } from "./ingestion-orchestrator";

interface ParsedRssEntry {
  title: string;
  description: string;
  link: string;
  /** Optional image URL from enclosure, media:content or first img in description. */
  imageUrl?: string;
}

const DEFAULT_FETCH_OPTIONS: RequestInit = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; NoticiasGamingBot/1.0; +https://github.com/noticias-gaming)",
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
  if (anyLink) return anyLink[1].replace(/\s+/g, " ").trim();
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

function parseRssEntries(xml: string): ParsedRssEntry[] {
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

    if (title) {
      entries.push({
        title,
        description,
        link,
        ...(imageUrl && { imageUrl })
      });
    }

    itemMatch = itemRegex.exec(xml);
  }

  return entries.slice(0, 6);
}

export interface FetchRssOptions {
  fetch?: typeof globalThis.fetch;
}

/**
 * Agregador: só título, descrição (resumo) e link para o site de origem.
 * Não busca a página do artigo nem armazena conteúdo completo.
 */
export async function fetchRssItemsBySource(
  source: SourceInput,
  options?: FetchRssOptions
): Promise<RawNewsItem[]> {
  const fetchFn = options?.fetch ?? fetch;
  const feedUrl = normalizeRssUrl(source.rssUrl);
  const response = await fetchFn(feedUrl, DEFAULT_FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(
      `RSS fetch failed for ${source.id}: ${response.status} ${response.statusText} (${feedUrl})`
    );
  }
  const xml = await response.text();
  const entries = parseRssEntries(xml);
  const items: RawNewsItem[] = [];

  for (const entry of entries) {
    if (!entry.link) continue;

    const content = entry.description || entry.title;
    items.push({
      sourceId: source.id,
      title: entry.title,
      content,
      language: source.language,
      sourceUrl: entry.link,
      ...(entry.imageUrl && { imageUrl: entry.imageUrl })
    });
  }

  return items;
}
