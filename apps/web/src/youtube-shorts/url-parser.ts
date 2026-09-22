export interface ParsedYoutubeVideoInput {
  videoId: string;
  canonicalUrl: string;
}

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeVideoInput(rawUrl: string): ParsedYoutubeVideoInput {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("URL do YouTube inválida.");
  }

  const host = parsedUrl.hostname.toLowerCase();
  let videoId = "";

  if (host.includes("youtube.com")) {
    if (parsedUrl.pathname.startsWith("/shorts/")) {
      videoId = parsedUrl.pathname.split("/")[2] ?? "";
    } else if (parsedUrl.pathname === "/watch") {
      videoId = parsedUrl.searchParams.get("v") ?? "";
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      videoId = parsedUrl.pathname.split("/")[2] ?? "";
    }
  } else if (host === "youtu.be") {
    videoId = parsedUrl.pathname.replace("/", "");
  }

  if (!VIDEO_ID_REGEX.test(videoId)) {
    throw new Error("Não foi possível identificar o videoId.");
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
