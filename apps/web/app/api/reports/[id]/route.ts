import { createReportRepository } from "../../../../../../packages/database/src/report-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const repo = createReportRepository();
  const report = await repo.getReportById(id);
  if (!report) {
    return Response.json({ error: "Relatório não encontrado" }, { status: 404 });
  }
  return Response.json({
    id: report.id,
    reportType: report.report_type,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    parameters: report.parameters,
    status: report.status,
    errorMessage: report.error_message,
    generatedAt: report.generated_at,
    createdAt: report.created_at,
    result: report.result?.payload ?? null
  });
}
