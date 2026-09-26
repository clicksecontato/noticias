import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";
import { youtubeMetadataToRow } from "../../../../packages/database/src/content-source-types";
import { fetchYoutubePublicMetadataByIds } from "../../../../packages/scraping/src/fetchers/youtube-content-fetcher";
import { recordYoutubeApiCall } from "./youtube-api-quota-repository";
import {
  backfillYoutubePublicMetadata,
  type YoutubeMetadataBackfillResult,
} from "./youtube-metadata-backfill";

function getWriteClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

/** Vídeos já no acervo que ainda não receberam o pacote de metadados públicos. */
export async function runYoutubeMetadataBackfill(): Promise<YoutubeMetadataBackfillResult> {
  const apiKey = process.env.YOUTUBE_API_KEY ?? "";
  if (!apiKey.trim()) {
    throw new Error("YOUTUBE_API_KEY não configurada.");
  }

  const client = getWriteClient();

  return backfillYoutubePublicMetadata({
    listPending: async () => {
      const { data, error } = await client
        .from("youtube_videos")
        .select("id, video_id")
        .is("duration_seconds", null)
        .is("has_captions", null)
        .is("youtube_category_id", null)
        .is("live_broadcast_content", null)
        .limit(5000);
      if (error) throw new Error(`Falha ao listar vídeos pendentes: ${error.message}`);
      return (data ?? []).map((row) => ({
        id: row.id as string,
        videoId: row.video_id as string,
      }));
    },
    fetchBatch: async (videoIds) =>
      fetchYoutubePublicMetadataByIds(videoIds, {
        apiKey,
        onApiCall: (method) => {
          if (method === "videos.list") {
            void recordYoutubeApiCall("videos.list", "backfill-metadados");
          }
        },
      }),
    save: async (id, metadata) => {
      const { error } = await client
        .from("youtube_videos")
        .update(youtubeMetadataToRow(metadata))
        .eq("id", id);
      if (error) throw new Error(`Falha ao gravar metadados do vídeo: ${error.message}`);
    },
  });
}
