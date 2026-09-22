import { createClient } from "@/src/lib/supabase/server";
import { createYoutubeShortPublishRepository } from "@/src/youtube-shorts/repository";

function getAdminTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return request.headers.get("X-Admin-Token");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const requestToken = getAdminTokenFromRequest(request);

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

  const validToken =
    !!process.env.ADMIN_INGEST_TOKEN &&
    requestToken === process.env.ADMIN_INGEST_TOKEN;
  if (!authorizedBySession && !validToken) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const repository = createYoutubeShortPublishRepository();
  const job = await repository.getJobById(id);
  if (!job) {
    return Response.json({ error: "Job não encontrado." }, { status: 404 });
  }

  return Response.json(job);
}
