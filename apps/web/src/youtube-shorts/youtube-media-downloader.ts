import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const YT_DLP_TIMEOUT_MS = 10 * 60 * 1000;

export interface DownloadYoutubeVideoOptions {
  ytDlpPath: string;
  /** URL canônica ou shorts. */
  videoUrl: string;
  outputDir: string;
  /** Limite de tamanho para yt-dlp (ex.: "500M"). */
  maxFilesize: string;
}

/**
 * Baixa o vídeo com yt-dlp para um diretório temporário.
 * Requer `yt-dlp` instalado no servidor (ou caminho em YT_DLP_PATH).
 */
export async function downloadYoutubeVideoWithYtDlp(
  options: DownloadYoutubeVideoOptions
): Promise<string> {
  const outputTemplate = join(options.outputDir, "source.%(ext)s");
  const args = [
    "-f",
    "bv*[ext=mp4]+ba[ext=m4a]/b*[ext=mp4]/bv*+ba/b",
    "--merge-output-format",
    "mp4",
    "--no-playlist",
    "--no-warnings",
    "-o",
    outputTemplate,
    "--max-filesize",
    options.maxFilesize,
    options.videoUrl,
  ];

  const stderrChunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(options.ytDlpPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new Error(
          "yt-dlp excedeu 10 minutos. Verifique rede, URL ou instale/atualize yt-dlp."
        )
      );
    }, YT_DLP_TIMEOUT_MS);
    child.on("error", (err) => {
      clearTimeout(timer);
      const message =
        err && typeof err === "object" && "code" in err && err.code === "ENOENT"
          ? `Executável não encontrado: "${options.ytDlpPath}". Instale yt-dlp ou defina YT_DLP_PATH.`
          : `Falha ao executar yt-dlp: ${String(err)}`;
      reject(new Error(message));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const stderr = Buffer.concat(stderrChunks).toString("utf-8");
      if (code !== 0) {
        reject(
          new Error(
            `yt-dlp encerrou com código ${code}. ${stderr.slice(-1500).trim() || "sem stderr."}`
          )
        );
      } else {
        resolve();
      }
    });
  });

  const files = await readdir(options.outputDir);
  const media = files.find((f) => /\.(mp4|webm|mkv)$/i.test(f));
  if (!media) {
    throw new Error(
      "yt-dlp não gerou arquivo de vídeo reconhecido (.mp4/.webm/.mkv)."
    );
  }
  return join(options.outputDir, media);
}

/** Converte bytes em string aceita pelo yt-dlp --max-filesize. */
export function maxFilesizeForYtDlp(maxBytes: number): string {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) return "500M";
  const mb = Math.floor(maxBytes / (1024 * 1024));
  if (mb < 1) return `${maxBytes}`;
  return `${mb}M`;
}
