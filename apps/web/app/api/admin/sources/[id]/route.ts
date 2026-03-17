import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../../../../packages/database/src/config";
import { NextRequest } from "next/server";

function getSupabaseClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id obrigatório" }, { status: 400 });
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("sources")
    .select("id,name,base_url,rss_url,language,trust_score,is_active,provider,channel_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Fonte não encontrada" }, { status: 404 });
  }

  return Response.json({
    id: data.id,
    name: data.name,
    baseUrl: data.base_url ?? undefined,
    rssUrl: data.rss_url ?? undefined,
    language: data.language,
    trustScore: data.trust_score,
    isActive: data.is_active,
    provider: data.provider,
    channelId: data.channel_id ?? undefined,
  });
}

type PatchBody = {
  name?: string;
  base_url?: string;
  rss_url?: string;
  language?: string;
  trust_score?: number;
  is_active?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id obrigatório" }, { status: 400 });
  }
  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.base_url !== undefined) updates.base_url = body.base_url ? String(body.base_url).trim() : null;
  if (body.rss_url !== undefined) updates.rss_url = body.rss_url ? String(body.rss_url).trim() : null;
  if (body.language !== undefined) updates.language = ["pt-BR", "pt", "en-US"].includes(String(body.language)) ? body.language : undefined;
  if (typeof body.trust_score === "number") updates.trust_score = body.trust_score;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (Object.keys(updates).length <= 1) {
    return Response.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("sources")
    .update(updates)
    .eq("id", id)
    .select("id,name,base_url,rss_url,language,trust_score,is_active,provider,channel_id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({
    id: data.id,
    name: data.name,
    baseUrl: data.base_url ?? undefined,
    rssUrl: data.rss_url ?? undefined,
    language: data.language,
    trustScore: data.trust_score,
    isActive: data.is_active,
    provider: data.provider,
    channelId: data.channel_id ?? undefined,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id obrigatório" }, { status: 400 });
  }
  const client = getSupabaseClient();
  const { error } = await client.from("sources").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}
