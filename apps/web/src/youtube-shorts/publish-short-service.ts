import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createYoutubeShortPublishRepository } from "../../../../packages/database/src/youtube-short-publish-repository";
import type { YoutubeShortPublishRepository } from "../../../../packages/database/src/youtube-short-publish-repository";
import { getYoutubeVideoSnapshot } from "./youtube-source-client";
import type {
  PublishYoutubeShortRequest,
  PublishYoutubeShortResponse,
  YoutubeVideoSnapshot,
} from "./contracts";
import { parseYoutubeVideoInput } from "./url-parser";
import {
  downloadYoutubeVideoWithYtDlp,
  maxFilesizeForYtDlp,
} from "./youtube-media-downloader";
import { uploadVideoToYoutubeChannel } from "./youtube-target-uploader";
import {
  getYoutubeShortUploadConfig,
  validateYoutubeShortUploadConfig,
  type YoutubeShortUploadConfig,
} from "./youtube-short-upload-config";

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

export interface PublishYoutubeShortDeps {
  repository?: YoutubeShortPublishRepository;
  getSnapshot?: (
    videoId: string,
    apiKey: string
  ) => Promise<YoutubeVideoSnapshot>;
  download?: typeof downloadYoutubeVideoWithYtDlp;
  upload?: typeof uploadVideoToYoutubeChannel;
  getUploadConfig?: typeof getYoutubeShortUploadConfig;
}

/**
 * Cria job, baixa o vídeo com yt-dlp e publica no canal OAuth (quando habilitado).
 */
export async function publishYoutubeShort(
  request: PublishYoutubeShortRequest,
  deps: PublishYoutubeShortDeps = {}
): Promise<PublishYoutubeShortResponse> {
  const repository = deps.repository ?? createYoutubeShortPublishRepository();
  const getSnapshot = deps.getSnapshot ?? getYoutubeVideoSnapshot;
  const download = deps.download ?? downloadYoutubeVideoWithYtDlp;
  const upload = deps.upload ?? uploadVideoToYoutubeChannel;
  const getUploadConfig = deps.getUploadConfig ?? getYoutubeShortUploadConfig;

  const parsed = parseYoutubeVideoInput(request.sourceUrl);
  const video = await getSnapshot(
    parsed.videoId,
    process.env.YOUTUBE_API_KEY ?? ""
  );

  const jobId = await repository.createJob({
    sourceUrl: parsed.canonicalUrl,
    sourceVideoId: video.videoId,
    sourceTitle: video.title,
    sourceChannelTitle: video.channelTitle,
    targetTitle: request.targetTitle?.trim() || video.title,
    targetDescription: request.targetDescription?.trim() || video.description,
    targetTags: normalizeTags(request.targetTags),
    targetPrivacyStatus: request.targetPrivacyStatus ?? "private",
  });

  await repository.updateJob(jobId, {
    status: "processing",
    startedAt: new Date().toISOString(),
  });

  const pipelineEnabled = process.env.YOUTUBE_SHORTS_REUPLOAD_ENABLED === "true";
  if (!pipelineEnabled) {
    const errorMessage =
      "Job criado com sucesso, mas o reupload automático está desabilitado. Defina YOUTUBE_SHORTS_REUPLOAD_ENABLED=true e configure OAuth + yt-dlp.";
    await repository.updateJob(jobId, {
      status: "failed",
      errorMessage,
      finishedAt: new Date().toISOString(),
    });
    return {
      jobId,
      status: "failed",
      message: errorMessage,
      errorMessage,
    };
  }

  const uploadCfg: YoutubeShortUploadConfig = getUploadConfig();
  const configError = validateYoutubeShortUploadConfig(uploadCfg);
  if (configError) {
    await repository.updateJob(jobId, {
      status: "failed",
      errorMessage: configError,
      finishedAt: new Date().toISOString(),
    });
    return {
      jobId,
      status: "failed",
      message: configError,
      errorMessage: configError,
    };
  }

  let workDir: string | null = null;
  try {
    workDir = await mkdtemp(join(tmpdir(), "yt-short-publish-"));
    const mediaPath = await download({
      ytDlpPath: uploadCfg.ytDlpPath,
      videoUrl: parsed.canonicalUrl,
      outputDir: workDir,
      maxFilesize: maxFilesizeForYtDlp(uploadCfg.maxDownloadBytes),
    });

    const title = request.targetTitle?.trim() || video.title;
    const description =
      request.targetDescription?.trim() || video.description;
    const tags = normalizeTags(request.targetTags);
    const privacy = request.targetPrivacyStatus ?? "private";

    const { videoId: targetVideoId, watchUrl } = await upload({
      config: {
        clientId: uploadCfg.clientId,
        clientSecret: uploadCfg.clientSecret,
        refreshToken: uploadCfg.refreshToken,
        redirectUri: uploadCfg.redirectUri,
      },
      filePath: mediaPath,
      title,
      description,
      tags,
      privacyStatus: privacy,
    });

    await repository.updateJob(jobId, {
      status: "completed",
      targetVideoId,
      targetVideoUrl: watchUrl,
      finishedAt: new Date().toISOString(),
    });

    return {
      jobId,
      status: "completed",
      message: "Vídeo publicado no canal de destino.",
      targetVideoId,
      targetVideoUrl: watchUrl,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido no pipeline.";
    await repository.updateJob(jobId, {
      status: "failed",
      errorMessage,
      finishedAt: new Date().toISOString(),
    });
    return {
      jobId,
      status: "failed",
      message: errorMessage,
      errorMessage,
    };
  } finally {
    if (workDir) {
      try {
        await rm(workDir, { recursive: true, force: true });
      } catch {
        // ignora falha de limpeza
      }
    }
  }
}
