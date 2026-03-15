import { NextRequest } from "next/server";

function extractHandle(urlOrHandle: string): string | null {
  const t = urlOrHandle.trim();
  const m = t.match(/@([^/]+)/);
  if (m) return m[1];
  if (t.startsWith("UC") && t.length >= 24) return null;
  if (/^[\w-]+$/.test(t)) return t;
  try {
    const path = new URL(t).pathname;
    const match = path.match(/\/@([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/sources/resolve-channel?handle=AtaqueCritico
 * Retorna o channel ID (UC...) do canal com esse handle. Exige X-Admin-Token ou Authorization.
 */
export async function GET(request: NextRequest) {
  const token =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.headers.get("X-Admin-Token")?.trim();
  const expected = process.env.ADMIN_INGEST_TOKEN?.trim();
  if (!expected || token !== expected) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const handleParam = request.nextUrl.searchParams.get("handle")?.trim();
  const urlParam = request.nextUrl.searchParams.get("url")?.trim();
  const input = handleParam || urlParam;
  if (!input) {
    return Response.json(
      { error: "Informe handle ou url: ?handle=AtaqueCritico ou ?url=https://www.youtube.com/@AtaqueCritico" },
      { status: 400 }
    );
  }

  const handle = extractHandle(input);
  if (!handle) {
    if (input.startsWith("UC") && input.length >= 24) {
      return Response.json({ channelId: input, source: "input" });
    }
    return Response.json(
      { error: "Não foi possível extrair o handle. Use @AtaqueCritico ou a URL do canal." },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "YOUTUBE_API_KEY não configurada" },
      { status: 500 }
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    items?: Array<{ id?: string }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    return Response.json(
      { error: data.error?.message || `YouTube API: ${res.status}` },
      { status: 400 }
    );
  }
  const channelId = data.items?.[0]?.id;
  if (!channelId) {
    return Response.json(
      { error: `Nenhum canal encontrado para o handle: @${handle}` },
      { status: 404 }
    );
  }
  return Response.json({ channelId, handle: `@${handle}` });
}
