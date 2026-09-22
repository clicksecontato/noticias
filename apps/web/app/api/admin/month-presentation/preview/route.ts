import { createClient } from "../../../../../src/lib/supabase/server";
import {
  generateMonthPresentationReport,
  type MonthPresentationFilters,
} from "../../../../../src/reports/generators/month-presentation";

type PreviewBody = {
  periodStart: string;
  periodEnd: string;
  filters?: MonthPresentationFilters;
};

export async function POST(request: Request): Promise<Response> {
  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const ps = body.periodStart?.trim();
  const pe = body.periodEnd?.trim();
  if (!ps || !pe) {
    return Response.json(
      { error: "Obrigatório: periodStart e periodEnd (YYYY-MM-DD ou ISO)" },
      { status: 400 }
    );
  }

  const periodStart = ps.length >= 10 ? ps.slice(0, 10) : ps;
  const periodEnd = pe.length >= 10 ? pe.slice(0, 10) : pe;

  let authorizedBySession = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorizedBySession = !!user;
  } catch {
    // sem sessão
  }

  if (!authorizedBySession) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = await generateMonthPresentationReport(periodStart, periodEnd, body.filters);
    return Response.json({ payload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
