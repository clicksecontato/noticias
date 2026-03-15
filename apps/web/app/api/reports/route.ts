import { createReportRepository } from "../../../../../packages/database/src/report-repository";
import type { ReportType, ReportStatus } from "../../../../../packages/database/src/report-types";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ReportType | null;
  const status = searchParams.get("status") as ReportStatus | null;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "20", 10);

  const repo = createReportRepository();
  const { items, total } = await repo.listReports({
    type: type ?? undefined,
    status: status ?? undefined,
    from,
    to,
    page,
    pageSize
  });

  return Response.json({ items, total });
}
