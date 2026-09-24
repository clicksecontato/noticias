import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";
import {
  getYoutubeApiDailyLimit,
  getYoutubeApiMethodUnits,
  youtubeQuotaDayKey,
  buildYoutubeQuotaSummary,
  type YoutubeApiMethod,
  type YoutubeQuotaSummary,
} from "./youtube-api-quota-policy";

export type YoutubeQuotaRecentEvent = {
  id: string;
  method: string;
  units: number;
  context: string | null;
  quotaDay: string;
  createdAt: string;
};

export type YoutubeQuotaSnapshot = YoutubeQuotaSummary & {
  recent: YoutubeQuotaRecentEvent[];
  tracked: boolean;
  note: string;
};

function getClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Persiste um evento de cota. Best-effort: nunca propaga erro ao caller.
 */
export async function recordYoutubeApiCall(
  method: YoutubeApiMethod,
  context?: string
): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;
    const units = getYoutubeApiMethodUnits(method);
    const quotaDay = youtubeQuotaDayKey();
    await client.from("youtube_api_quota_events").insert({
      method,
      units,
      context: context?.slice(0, 240) || null,
      quota_day: quotaDay,
    });
  } catch {
    // não bloqueia fluxo operacional
  }
}

export async function getYoutubeQuotaSnapshot(): Promise<YoutubeQuotaSnapshot> {
  const quotaDay = youtubeQuotaDayKey();
  const dailyLimit = getYoutubeApiDailyLimit();
  const note =
    "Estimativa com base no calculador clássico da YouTube Data API v3. " +
    "O Console do Google Cloud é a fonte da verdade. A cota reinicia à meia-noite (Pacific Time).";

  const empty = buildYoutubeQuotaSummary({
    dailyLimit,
    quotaDay,
    events: [],
  });

  const client = getClient();
  if (!client) {
    return {
      ...empty,
      recent: [],
      tracked: false,
      note: note + " Supabase não configurado — tracking desativado.",
    };
  }

  try {
    const { data, error } = await client
      .from("youtube_api_quota_events")
      .select("id,method,units,context,quota_day,created_at")
      .eq("quota_day", quotaDay)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ...empty,
        recent: [],
        tracked: false,
        note: `${note} Erro ao ler eventos: ${error.message}. Rode a migration 030.`,
      };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      method: string;
      units: number;
      context: string | null;
      quota_day: string;
      created_at: string;
    }>;

    const summary = buildYoutubeQuotaSummary({
      dailyLimit,
      quotaDay,
      events: rows.map((r) => ({
        method: r.method,
        units: r.units,
        context: r.context,
      })),
    });

    return {
      ...summary,
      recent: rows.slice(0, 30).map((r) => ({
        id: r.id,
        method: r.method,
        units: r.units,
        context: r.context,
        quotaDay: r.quota_day,
        createdAt: r.created_at,
      })),
      tracked: true,
      note,
    };
  } catch (err) {
    return {
      ...empty,
      recent: [],
      tracked: false,
      note: `${note} Falha ao consultar: ${err instanceof Error ? err.message : "erro"}`,
    };
  }
}
