export type ClassifiedMedia =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string };

export function classifyMediaUrl(
  input: string | null | undefined
): ClassifiedMedia | undefined {
  const url = (input ?? "").trim();
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // YouTube: trata como vídeo.
    if (
      hostname === "www.youtube.com" ||
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      if (pathname.startsWith("/embed/") || pathname.startsWith("/watch")) {
        return { kind: "video", url };
      }
    }
    if (hostname === "youtu.be") {
      return { kind: "video", url };
    }

    // Extensões de vídeo comuns.
    if (/\.(mp4|webm|m3u8|mov)(\?|$)/i.test(pathname)) {
      return { kind: "video", url };
    }

    // Se tiver extensão de imagem conhecida, é bem provável que seja OK.
    if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(pathname)) {
      return { kind: "image", url };
    }

    // Sem extensão: ainda pode ser imagem (CDN, querystring, etc). Aceita por padrão,
    // classificando como imagem "genérica".
    return { kind: "image", url };
  } catch {
    // Se não for URL válida, não usa como mídia.
    return undefined;
  }
}
