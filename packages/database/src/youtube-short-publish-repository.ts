import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "./config";
import type {
  CreateYoutubeShortPublishJobInput,
  UpdateYoutubeShortPublishJobInput,
  YoutubeShortPublishJob,
} from "./youtube-short-publish-types";

export interface YoutubeShortPublishRepository {
  createJob(input: CreateYoutubeShortPublishJobInput): Promise<string>;
  updateJob(id: string, input: UpdateYoutubeShortPublishJobInput): Promise<void>;
  getJobById(id: string): Promise<YoutubeShortPublishJob | null>;
}

function createSupabaseYoutubeShortPublishRepository(): YoutubeShortPublishRepository {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) {
    throw new Error("Supabase URL and key required for youtube short publish repository");
  }
  const client = createClient(url, key);

  return {
    async createJob(input) {
      const { data, error } = await client
        .from("youtube_short_publish_jobs")
        .insert({
          source_url: input.sourceUrl,
          source_video_id: input.sourceVideoId,
          source_title: input.sourceTitle,
          source_channel_title: input.sourceChannelTitle,
          target_title: input.targetTitle,
          target_description: input.targetDescription,
          target_tags: input.targetTags ?? [],
          target_privacy_status: input.targetPrivacyStatus ?? "private",
          status: "pending",
        })
        .select("id")
        .single();
      if (error) {
        throw new Error(`Failed to create youtube short publish job: ${error.message}`);
      }
      return data.id;
    },

    async updateJob(id, input) {
      const { error } = await client
        .from("youtube_short_publish_jobs")
        .update({
          status: input.status,
          target_video_id: input.targetVideoId,
          target_video_url: input.targetVideoUrl,
          error_message: input.errorMessage,
          started_at: input.startedAt,
          finished_at: input.finishedAt,
        })
        .eq("id", id);
      if (error) {
        throw new Error(`Failed to update youtube short publish job: ${error.message}`);
      }
    },

    async getJobById(id) {
      const { data, error } = await client
        .from("youtube_short_publish_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(`Failed to fetch youtube short publish job: ${error.message}`);
      }
      return data;
    },
  };
}

function createMemoryYoutubeShortPublishRepository(): YoutubeShortPublishRepository {
  const jobs = new Map<string, YoutubeShortPublishJob>();
  let seq = 0;

  return {
    async createJob(input) {
      seq += 1;
      const id = `memory-short-job-${seq}`;
      jobs.set(id, {
        id,
        source_url: input.sourceUrl,
        source_video_id: input.sourceVideoId,
        source_title: input.sourceTitle,
        source_channel_title: input.sourceChannelTitle,
        target_title: input.targetTitle,
        target_description: input.targetDescription,
        target_tags: input.targetTags ?? [],
        target_privacy_status: input.targetPrivacyStatus ?? "private",
        status: "pending",
        created_at: new Date().toISOString(),
      });
      return id;
    },

    async updateJob(id, input) {
      const job = jobs.get(id);
      if (!job) return;
      jobs.set(id, {
        ...job,
        status: input.status,
        target_video_id: input.targetVideoId ?? job.target_video_id,
        target_video_url: input.targetVideoUrl ?? job.target_video_url,
        error_message: input.errorMessage ?? job.error_message,
        started_at: input.startedAt ?? job.started_at,
        finished_at: input.finishedAt ?? job.finished_at,
      });
    },

    async getJobById(id) {
      return jobs.get(id) ?? null;
    },
  };
}

export function createYoutubeShortPublishRepository(): YoutubeShortPublishRepository {
  const config = getDatabaseConfig();
  return config.contentSource === "supabase"
    ? createSupabaseYoutubeShortPublishRepository()
    : createMemoryYoutubeShortPublishRepository();
}
