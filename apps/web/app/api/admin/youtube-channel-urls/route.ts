import { createClient } from "@supabase/supabase-js";
import {
  activeYoutubeChannelUrls,
  fetchYoutubeHandleByChannelId,
  youtubeHandleName,
} from "../../../../src/admin/youtube-channel-urls";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

/**
 * GET /api/admin/youtube-channel-urls
 * URLs https://www.youtube.com/@canal dos canais ativos, para colar na descrição.
 */
export async function GET(): Promise<Response> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("sources")
      .select("name, provider, channel_id, is_active")
      .eq("provider", "youtube")
      .eq("is_active", true)
      .order("name");
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Array<{
      name: string;
      provider: string | null;
      channel_id: string | null;
      is_active: boolean;
    }>;

    const needsLookup = rows
      .map((row) => row.channel_id?.trim() ?? "")
      .filter((id) => id.startsWith("UC") && !youtubeHandleName(id));
    let handleById = new Map<string, string>();
    if (needsLookup.length > 0) {
      const apiKey = process.env.YOUTUBE_API_KEY?.trim();
      if (!apiKey) {
        return Response.json(
          { error: "YOUTUBE_API_KEY não configurada; não é possível resolver o @ dos canais." },
          { status: 500 }
        );
      }
      handleById = await fetchYoutubeHandleByChannelId(apiKey, needsLookup);
    }

    const sources = rows.map((row) => ({
      name: row.name,
      provider: "youtube" as const,
      isActive: true,
      channelId: row.channel_id,
      handle: handleById.get(row.channel_id?.trim() ?? "") ?? null,
    }));
    const text = activeYoutubeChannelUrls(sources);
    const listed = new Set(text.split("\n").filter(Boolean));
    const missing = sources
      .filter((source) => {
        const handle = source.handle ?? youtubeHandleName(source.channelId);
        return !handle || !listed.has(`https://www.youtube.com/@${handle}`);
      })
      .map((source) => source.name);

    return Response.json({ text, missing });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Erro ao montar as URLs dos canais";
    return Response.json({ error: message }, { status: 500 });
  }
}
