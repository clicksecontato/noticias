import { createClient } from "@/src/lib/supabase/server";
import { handleAdminYoutubeShortsRequest } from "@/src/api/admin-youtube-shorts-handler";
import { publishYoutubeShort } from "@/src/youtube-shorts/publish-short-service";
import type { PublishYoutubeShortRequest } from "@/src/youtube-shorts/contracts";

/** Upload pode levar vários minutos (yt-dlp + YouTube). Ajuste conforme host. */
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  let body: PublishYoutubeShortRequest = { sourceUrl: "" };
  try {
    const parsed = await request.json();
    body = {
      sourceUrl: typeof parsed?.sourceUrl === "string" ? parsed.sourceUrl : "",
      token: typeof parsed?.token === "string" ? parsed.token : undefined,
      targetTitle:
        typeof parsed?.targetTitle === "string" ? parsed.targetTitle : undefined,
      targetDescription:
        typeof parsed?.targetDescription === "string"
          ? parsed.targetDescription
          : undefined,
      targetTags: Array.isArray(parsed?.targetTags)
        ? parsed.targetTags.filter((tag: unknown) => typeof tag === "string")
        : undefined,
      targetPrivacyStatus:
        parsed?.targetPrivacyStatus === "public" ||
        parsed?.targetPrivacyStatus === "unlisted" ||
        parsed?.targetPrivacyStatus === "private"
          ? parsed.targetPrivacyStatus
          : undefined,
    };
  } catch {
    return Response.json(
      { error: "Body inválido. Envie sourceUrl e opções de publicação." },
      { status: 400 }
    );
  }

  let authorizedBySession = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorizedBySession = !!user;
  } catch {
    // ignora erro de sessão, segue com fallback de token
  }

  const result = await handleAdminYoutubeShortsRequest(
    body,
    {
      ADMIN_INGEST_TOKEN: process.env.ADMIN_INGEST_TOKEN,
      authorizedBySession,
    },
    publishYoutubeShort
  );

  return Response.json(result.body, { status: result.status });
}
