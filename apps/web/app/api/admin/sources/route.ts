import { createClient } from "@supabase/supabase-js";
import { createContentRepository } from "../../../../../../packages/database/src/content-repository";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

export async function GET(request: Request): Promise<Response> {
  const all = new URL(request.url).searchParams.get("all") === "true";

  if (all) {
    const client = getSupabaseClient();
    const { data: rows, error } = await client
      .from("sources")
      .select("id,name,language,provider,rss_url,channel_id,is_active")
      .order("name");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const sources = (rows ?? []).map((r: { id: string; name: string; language: string; provider: string | null; rss_url: string | null; channel_id: string | null; is_active: boolean }) => ({
      id: r.id,
      name: r.name,
      rssUrl: r.rss_url ?? undefined,
      language: r.language,
      isActive: r.is_active ?? true,
      provider: (r.provider === "youtube" ? "youtube" : "rss") as "rss" | "youtube",
      channelId: r.channel_id ?? undefined
    }));
    return Response.json({ sources });
  }

  const repository = createContentRepository();
  const sources = await repository.getContentSourcesForIngestion();
  const sourceIds = sources.map((s) => s.id);
  return Response.json({
    sourceIds,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      rssUrl: s.rssUrl ?? undefined,
      language: s.language,
      isActive: s.isActive,
      provider: s.provider,
      channelId: s.channelId ?? undefined
    }))
  });
}

type PostSourceBody = {
  id: string;
  name: string;
  rss_url?: string;
  language: string;
  base_url?: string;
  is_active?: boolean;
  trust_score?: number;
  /** 'rss' | 'youtube' */
  provider?: string;
  /** ID do canal (UC...) ou URL do canal (ex.: https://www.youtube.com/@Handle/videos). */
  channel_id?: string;
  /** Alternativa a channel_id: URL do canal ou @handle para resolver via API. */
  channel_url?: string;
};

/**
 * Extrai o handle (@nome) de uma URL do YouTube ou devolve o próprio valor se já for um handle.
 */
function extractYoutubeHandle(urlOrHandle: string): string | null {
  const trimmed = urlOrHandle.trim();
  const match = trimmed.match(/@([^/]+)/);
  if (match) return match[1];
  if (trimmed.startsWith("UC") && trimmed.length >= 24) return null;
  if (/^[\w-]+$/.test(trimmed)) return trimmed;
  try {
    const path = new URL(trimmed).pathname;
    const m = path.match(/\/@([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Gera slug para usar como id interno (ex.: FlowGamesPodcast → flow-games-podcast). */
function slugifyHandle(handle: string): string {
  return handle
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || handle.toLowerCase();
}

/**
 * Resolve URL ou @handle para Channel ID (UC...) via YouTube Data API.
 * Usa channels.list com forHandle (canal exato do handle); fallback para search se necessário.
 */
async function resolveYoutubeChannelId(apiKey: string, urlOrHandle: string): Promise<string> {
  const handle = extractYoutubeHandle(urlOrHandle);
  if (!handle) {
    if (urlOrHandle.trim().startsWith("UC") && urlOrHandle.trim().length >= 24) {
      return urlOrHandle.trim();
    }
    throw new Error("URL ou handle do canal inválido. Use algo como: https://www.youtube.com/@NomeCanal/videos ou @NomeCanal");
  }

  // 1) channels.list com forHandle = canal exato que possui @handle (recomendado desde 2024)
  const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelsUrl.searchParams.set("part", "id");
  channelsUrl.searchParams.set("forHandle", handle);
  channelsUrl.searchParams.set("key", apiKey);
  const channelsRes = await fetch(channelsUrl.toString());
  const channelsData = (await channelsRes.json()) as {
    items?: Array<{ id?: string }>;
    error?: { message?: string; code?: number };
  };
  if (channelsRes.ok && channelsData.items?.length) {
    const id = channelsData.items[0].id;
    if (id) return id;
  }

  // 2) Fallback: search.list (pode retornar outro canal com nome parecido)
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("type", "channel");
  searchUrl.searchParams.set("q", `@${handle}`);
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("maxResults", "1");
  const searchRes = await fetch(searchUrl.toString());
  const searchData = (await searchRes.json()) as {
    items?: Array<{ id?: { kind?: string; channelId?: string } }>;
    error?: { message?: string };
  };
  if (!searchRes.ok) {
    const msg = searchData.error?.message || channelsData.error?.message || `HTTP ${searchRes.status}`;
    throw new Error(`YouTube API: ${msg}`);
  }
  const channelId = searchData.items?.[0]?.id?.channelId;
  if (!channelId) {
    throw new Error(`Canal não encontrado para: @${handle}. Verifique a URL ou o handle.`);
  }
  return channelId;
}

export async function POST(request: Request): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json(
      { error: "Configuração Supabase ausente" },
      { status: 500 }
    );
  }

  let body: PostSourceBody;
  try {
    body = (await request.json()) as PostSourceBody;
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const provider = body.provider === "youtube" ? "youtube" : "rss";
  let channelIdToSave: string | null = null;
  let youtubeHandle: string | null = null;
  if (provider === "youtube") {
    const channelInput = (body.channel_url ?? body.channel_id)?.trim();
    youtubeHandle = channelInput ? extractYoutubeHandle(channelInput) : null;
    if (!channelInput) {
      return Response.json(
        { error: "Para fonte YouTube, informe channel_id ou channel_url (ex.: https://www.youtube.com/@Canal/videos)" },
        { status: 400 }
      );
    }
    if (channelInput.startsWith("UC") && channelInput.length >= 24) {
      channelIdToSave = channelInput;
    } else {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return Response.json(
          { error: "YOUTUBE_API_KEY não configurada; não é possível resolver URL do canal." },
          { status: 500 }
        );
      }
      try {
        channelIdToSave = await resolveYoutubeChannelId(apiKey, channelInput);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 400 });
      }
    }
  } else {
    if (!body.rss_url?.trim()) {
      return Response.json(
        { error: "Para fonte RSS, rss_url é obrigatório" },
        { status: 400 }
      );
    }
  }

  const idToSave =
    body.id?.trim() ||
    (provider === "youtube" && youtubeHandle ? slugifyHandle(youtubeHandle) : "");
  const { name, rss_url, language, base_url, is_active, trust_score } = body;
  if (!idToSave || !name?.trim() || !language?.trim()) {
    return Response.json(
      { error: "Campos obrigatórios: name e language. Para YouTube, informe a URL do canal (o ID é gerado automaticamente)." },
      { status: 400 }
    );
  }

  const validLanguage = ["pt-BR", "pt", "en-US"].includes(language)
    ? language
    : "pt-BR";
  const client = createClient(url, serviceKey);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("sources")
    .upsert(
      {
        id: idToSave,
        name: name.trim(),
        rss_url: provider === "rss" ? (rss_url?.trim() || null) : null,
        language: validLanguage,
        base_url: base_url?.trim() || null,
        is_active: is_active ?? true,
        trust_score: trust_score ?? 50,
        provider,
        channel_id: provider === "youtube" ? channelIdToSave : null,
        updated_at: now
      },
      { onConflict: "id" }
    )
    .select("id,name,rss_url,language,base_url,is_active,trust_score,provider,channel_id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(
    {
      id: data.id,
      name: data.name,
      rssUrl: data.rss_url ?? undefined,
      language: data.language,
      baseUrl: data.base_url,
      isActive: data.is_active,
      trustScore: data.trust_score,
      provider: data.provider,
      channelId: data.channel_id ?? undefined
    },
    { status: 201 }
  );
}
