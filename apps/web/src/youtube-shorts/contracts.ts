export interface PublishYoutubeShortRequest {
  token?: string;
  sourceUrl: string;
  targetTitle?: string;
  targetDescription?: string;
  targetTags?: string[];
  targetPrivacyStatus?: "private" | "unlisted" | "public";
}

export interface PublishYoutubeShortResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  targetVideoId?: string;
  targetVideoUrl?: string;
  errorMessage?: string;
}

export interface YoutubeVideoSnapshot {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  canonicalUrl: string;
}

export interface YoutubeShortPublishResult {
  status: "completed" | "failed";
  message: string;
  targetVideoId?: string;
  targetVideoUrl?: string;
  errorMessage?: string;
}
