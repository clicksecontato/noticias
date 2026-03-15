import { createReportRepository } from "../../../../../../packages/database/src/report-repository";
import type { ReportType } from "../../../../../../packages/database/src/report-types";
import { generateReportPayload, SUPPORTED_REPORT_TYPES } from "../../../../src/reports/run-report";

type GenerateBody = {
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  options?: { group_by?: "day" | "week" | "month"; limit_sources?: number };
  filters?: { gameId?: string; tagId?: string; genreId?: string; platformId?: string };
};

export async function POST(request: Request): Promise<Response> {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return Response.json(
      { error: "Body JSON inválido" },
      { status: 400 }
    );
  }

  const { reportType, periodStart, periodEnd, options = {}, filters } = body;
  if (!reportType || !periodStart || !periodEnd) {
    return Response.json(
      { error: "Obrigatório: reportType, periodStart, periodEnd" },
      { status: 400 }
    );
  }
  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    return Response.json(
      { error: `reportType deve ser um de: ${SUPPORTED_REPORT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json(
      { error: "periodStart e periodEnd devem ser datas válidas (ISO 8601)" },
      { status: 400 }
    );
  }
  if (start > end) {
    return Response.json(
      { error: "periodStart deve ser anterior a periodEnd" },
      { status: 400 }
    );
  }

  const repo = createReportRepository();
  const reportFilters = filters
    ? {
        ...(filters.gameId && { gameId: filters.gameId }),
        ...(filters.tagId && { tagId: filters.tagId }),
        ...(filters.genreId && { genreId: filters.genreId }),
        ...(filters.platformId && { platformId: filters.platformId })
      }
    : undefined;
  let reportId: string;
  try {
    reportId = await repo.createReport({
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      parameters: { ...options, filters: reportFilters }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Falha ao criar registro do relatório: ${msg}` },
      { status: 500 }
    );
  }

  try {
    const [articles, videos, sourceNames] = await Promise.all([
      repo.getArticlesForReports(periodStart, periodEnd, reportFilters),
      repo.getVideosForReports(periodStart, periodEnd, reportFilters),
      repo.getSourceIdToName()
    ]);

    const payload = generateReportPayload(
      reportType,
      { articles, videos, sourceNames },
      {
        group_by: options.group_by,
        limit_sources: options.limit_sources
      }
    );

    await repo.saveReportResult(reportId, payload);
    await repo.updateReportStatus(reportId, "completed", {
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await repo.updateReportStatus(reportId, "failed", {
      error_message: msg,
      generated_at: new Date().toISOString()
    });
    return Response.json(
      { error: `Falha ao gerar relatório: ${msg}`, reportId },
      { status: 500 }
    );
  }

  return Response.json(
    {
      reportId,
      status: "completed",
      periodStart,
      periodEnd,
      reportType
    },
    { status: 201 }
  );
}
