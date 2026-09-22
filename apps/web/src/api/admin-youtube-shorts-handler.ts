import type {
  PublishYoutubeShortRequest,
  PublishYoutubeShortResponse,
} from "../youtube-shorts/contracts";

export interface AdminYoutubeShortsResponse {
  status: number;
  body: PublishYoutubeShortResponse;
}

export interface AdminYoutubeShortsContext {
  ADMIN_INGEST_TOKEN?: string;
  authorizedBySession?: boolean;
}

export type ExecuteYoutubeShortPublish = (
  request: PublishYoutubeShortRequest
) => Promise<PublishYoutubeShortResponse>;

export async function handleAdminYoutubeShortsRequest(
  request: PublishYoutubeShortRequest,
  context: AdminYoutubeShortsContext,
  executePublish: ExecuteYoutubeShortPublish
): Promise<AdminYoutubeShortsResponse> {
  const authorizedBySession = context.authorizedBySession === true;
  const validToken =
    context.ADMIN_INGEST_TOKEN &&
    request.token === context.ADMIN_INGEST_TOKEN;

  if (!authorizedBySession && !validToken) {
    return {
      status: 401,
      body: {
        jobId: "",
        status: "failed",
        message: "Não autorizado.",
        errorMessage: "Não autorizado.",
      },
    };
  }

  if (!request.sourceUrl?.trim()) {
    return {
      status: 400,
      body: {
        jobId: "",
        status: "failed",
        message: "sourceUrl é obrigatório.",
        errorMessage: "sourceUrl é obrigatório.",
      },
    };
  }

  const body = await executePublish(request);
  return {
    status: 200,
    body,
  };
}
