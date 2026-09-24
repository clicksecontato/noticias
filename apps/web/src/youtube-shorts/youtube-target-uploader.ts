import { createReadStream } from "node:fs";
import { google } from "googleapis";
import type { YoutubeShortUploadConfig } from "./youtube-short-upload-config";
import { recordYoutubeApiCall } from "../admin/youtube-api-quota-repository";

export interface UploadVideoToYoutubeChannelInput {
  config: Pick<
    YoutubeShortUploadConfig,
    "clientId" | "clientSecret" | "refreshToken" | "redirectUri"
  >;
  filePath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: "private" | "unlisted" | "public";
}

function clipTags(tags: string[]): string[] {
  /** YouTube limita tags individuais e total aproximado; mantém lista curta. */
  const out: string[] = [];
  let total = 0;
  for (const raw of tags) {
    const t = raw.slice(0, 100);
    if (!t) continue;
    if (total + t.length > 450) break;
    out.push(t);
    total += t.length;
  }
  return out;
}

/**
 * Faz upload do arquivo para o canal associado ao refresh token (OAuth2).
 * Escopo necessário na conta: youtube.upload
 */
export async function uploadVideoToYoutubeChannel(
  input: UploadVideoToYoutubeChannelInput
): Promise<{ videoId: string; watchUrl: string }> {
  const oauth2Client = new google.auth.OAuth2(
    input.config.clientId,
    input.config.clientSecret,
    input.config.redirectUri
  );
  oauth2Client.setCredentials({
    refresh_token: input.config.refreshToken,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const tags = clipTags(input.tags);
  void recordYoutubeApiCall("videos.insert", "shorts-upload");
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: input.title.slice(0, 100),
        description: input.description.slice(0, 5000),
        tags: tags.length > 0 ? tags : undefined,
        categoryId: "22",
      },
      status: {
        privacyStatus: input.privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(input.filePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) {
    throw new Error("YouTube não retornou id do vídeo após upload.");
  }
  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
