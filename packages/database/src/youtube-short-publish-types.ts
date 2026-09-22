export type YoutubeShortPublishStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface YoutubeShortPublishJob {
  id: string;
  source_url: string;
  source_video_id: string;
  source_title?: string;
  source_channel_title?: string;
  target_title?: string;
  target_description?: string;
  target_tags?: string[];
  target_privacy_status: "private" | "unlisted" | "public";
  status: YoutubeShortPublishStatus;
  target_video_id?: string;
  target_video_url?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface CreateYoutubeShortPublishJobInput {
  sourceUrl: string;
  sourceVideoId: string;
  sourceTitle?: string;
  sourceChannelTitle?: string;
  targetTitle?: string;
  targetDescription?: string;
  targetTags?: string[];
  targetPrivacyStatus?: "private" | "unlisted" | "public";
}

export interface UpdateYoutubeShortPublishJobInput {
  status: YoutubeShortPublishStatus;
  targetVideoId?: string;
  targetVideoUrl?: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
}
