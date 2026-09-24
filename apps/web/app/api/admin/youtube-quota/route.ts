import { getYoutubeQuotaSnapshot } from "../../../../src/admin/youtube-api-quota-repository";

/**
 * GET /api/admin/youtube-quota
 * Snapshot do uso estimado de cota da YouTube Data API v3 no dia PT.
 */
export async function GET(): Promise<Response> {
  const snapshot = await getYoutubeQuotaSnapshot();
  return Response.json(snapshot);
}
