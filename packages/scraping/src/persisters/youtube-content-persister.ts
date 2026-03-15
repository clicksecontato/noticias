import type { IContentPersister } from "./content-persister.interface";
import type { ContentSource, FetchedContentItem, PersistContentResult } from "../content-sources/types";

/** Port: item de vídeo esperado pelo repositório (alinhado a youtube_videos). */
export interface YoutubeVideoInput {
  videoId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  thumbnailUrl?: string | null;
}

export interface SaveYoutubeVideosResult {
  created: number;
  skipped: number;
  skippedItems: Array<{ sourceId: string; title: string; url?: string }>;
}

export interface YoutubePersisterDeps {
  saveYoutubeVideos: (
    sourceId: string,
    items: YoutubeVideoInput[]
  ) => Promise<SaveYoutubeVideosResult>;
}

/**
 * Persister de vídeos YouTube: mapeia FetchedContentItem → YoutubeVideoInput e delega.
 */
export function createYoutubeContentPersister(deps: YoutubePersisterDeps): IContentPersister {
  return {
    async persist(source: ContentSource, items: FetchedContentItem[]): Promise<PersistContentResult> {
      if (source.provider !== "youtube") {
        throw new Error("YouTube persister exige provider 'youtube'");
      }

      const input: YoutubeVideoInput[] = items.map((item) => ({
        videoId: item.externalId,
        title: item.title,
        description: item.description,
        url: item.url,
        publishedAt: item.publishedAt,
        thumbnailUrl: item.imageUrl ?? null
      }));

      const result = await deps.saveYoutubeVideos(source.id, input);
      return result;
    }
  };
}
