import type { YoutubePublicMetadata } from "../../../../packages/scraping/src/content-sources/types";

export const YOUTUBE_METADATA_BATCH_SIZE = 50;

export interface PendingYoutubeVideo {
  id: string;
  videoId: string;
}

export interface YoutubeMetadataBackfillResult {
  pending: number;
  updated: number;
  missingOnYoutube: number;
}

export function chunkVideoIds(ids: string[], size = YOUTUBE_METADATA_BATCH_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

/**
 * Preenche metadados públicos só nos vídeos já salvos que ainda não têm esses campos.
 * Não cria vídeo novo e não altera título, descrição ou pauta.
 */
export async function backfillYoutubePublicMetadata(deps: {
  listPending: () => Promise<PendingYoutubeVideo[]>;
  fetchBatch: (videoIds: string[]) => Promise<Map<string, YoutubePublicMetadata>>;
  save: (id: string, metadata: YoutubePublicMetadata) => Promise<void>;
}): Promise<YoutubeMetadataBackfillResult> {
  const pending = await deps.listPending();
  let updated = 0;
  let missingOnYoutube = 0;

  for (const chunk of chunkVideoIds(pending.map((row) => row.videoId))) {
    const byVideoId = await deps.fetchBatch(chunk);
    const rows = pending.filter((row) => chunk.includes(row.videoId));
    for (const row of rows) {
      const metadata = byVideoId.get(row.videoId);
      if (!metadata) {
        missingOnYoutube += 1;
        continue;
      }
      await deps.save(row.id, metadata);
      updated += 1;
    }
  }

  return { pending: pending.length, updated, missingOnYoutube };
}
