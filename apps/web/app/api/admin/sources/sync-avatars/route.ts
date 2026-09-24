import { createClient } from "@supabase/supabase-js";
import { fetchYoutubeChannelProfile } from "../../../../../src/admin/youtube-channel-avatar";

/**
 * Backfill: busca avatar YouTube para fontes youtube sem image_url.
 * POST /api/admin/sources/sync-avatars
 */
export async function POST(): Promise<Response> {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!url || !serviceKey) {
    return Response.json({ error: "Configuração Supabase ausente" }, { status: 500 });
  }
  if (!apiKey) {
    return Response.json(
      { error: "YOUTUBE_API_KEY não configurada" },
      { status: 500 }
    );
  }

  const client = createClient(url, serviceKey);
  const { data: rows, error } = await client
    .from("sources")
    .select("id,channel_id,image_url")
    .eq("provider", "youtube")
    .not("channel_id", "is", null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const missing = (rows ?? []).filter(
    (r: { id: string; channel_id: string | null; image_url: string | null }) =>
      Boolean(r.channel_id) && !r.image_url?.trim()
  );

  let updated = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const row of missing) {
    const channelId = String(row.channel_id);
    try {
      const profile = await fetchYoutubeChannelProfile(apiKey, channelId);
      if (!profile.imageUrl) continue;
      const { error: upErr } = await client
        .from("sources")
        .update({
          image_url: profile.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (upErr) {
        failures.push({ id: row.id, error: upErr.message });
      } else {
        updated += 1;
      }
    } catch (err) {
      failures.push({
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({
    checked: missing.length,
    updated,
    failures,
  });
}
