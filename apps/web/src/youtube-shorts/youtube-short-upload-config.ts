/**
 * Configuração de ambiente para reupload de Shorts (OAuth destino + yt-dlp).
 * Mantida separada do domínio para não hardcodar env em serviços.
 */

export interface YoutubeShortUploadConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  ytDlpPath: string;
  maxDownloadBytes: number;
}

const DEFAULT_REDIRECT_URI = "http://localhost:3000";
const DEFAULT_YT_DLP = "yt-dlp";
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;

export function getYoutubeShortUploadConfig(
  env: Record<string, string | undefined> = process.env
): YoutubeShortUploadConfig {
  const maxRaw = env.YOUTUBE_SHORT_MAX_DOWNLOAD_BYTES?.trim();
  const maxParsed = maxRaw ? Number.parseInt(maxRaw, 10) : NaN;
  const maxDownloadBytes =
    Number.isFinite(maxParsed) && maxParsed > 0 ? maxParsed : DEFAULT_MAX_BYTES;

  return {
    clientId: env.YOUTUBE_OAUTH_CLIENT_ID?.trim() ?? "",
    clientSecret: env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim() ?? "",
    refreshToken: env.YOUTUBE_REFRESH_TOKEN?.trim() ?? "",
    redirectUri:
      env.YOUTUBE_OAUTH_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI,
    ytDlpPath: env.YT_DLP_PATH?.trim() || DEFAULT_YT_DLP,
    maxDownloadBytes,
  };
}

/** Retorna primeira mensagem de erro ou null se válido. */
export function validateYoutubeShortUploadConfig(
  cfg: YoutubeShortUploadConfig
): string | null {
  if (!cfg.clientId) {
    return "YOUTUBE_OAUTH_CLIENT_ID é obrigatório para publicar no canal.";
  }
  if (!cfg.clientSecret) {
    return "YOUTUBE_OAUTH_CLIENT_SECRET é obrigatório para publicar no canal.";
  }
  if (!cfg.refreshToken) {
    return "YOUTUBE_REFRESH_TOKEN é obrigatório (conta/canal de destino).";
  }
  if (!cfg.ytDlpPath) {
    return "YT_DLP_PATH inválido.";
  }
  return null;
}
