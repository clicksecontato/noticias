import { getDatabaseConfig } from "../../../../../../packages/database/src/config";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { FonteEditClient } from "../FonteEditClient";

async function getSource(id: string) {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) return null;
  const client = createClient(url, key);
  const { data, error } = await client
    .from("sources")
    .select("id,name,base_url,rss_url,language,trust_score,is_active,provider,channel_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    baseUrl: data.base_url ?? "",
    rssUrl: data.rss_url ?? "",
    language: data.language,
    trustScore: data.trust_score ?? 50,
    isActive: data.is_active ?? true,
    provider: data.provider ?? "rss",
    channelId: data.channel_id ?? "",
  };
}

export default async function AdminFonteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getSource(id);
  if (!source) notFound();
  return <FonteEditClient source={source} />;
}
