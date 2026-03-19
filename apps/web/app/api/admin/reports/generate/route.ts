import { createReportRepository } from "../../../../../../../packages/database/src/report-repository";
import type { ReportType } from "../../../../../../../packages/database/src/report-types";
import { generateExecutiveSummaryReport } from "../../../../../src/reports/generators/executive-summary";
import { generateReportPayload, SUPPORTED_REPORT_TYPES } from "../../../../../src/reports/run-report";

type GenerateBody = {
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  options?: {
    group_by?: "day" | "week" | "month";
    limit_sources?: number;
    limit_tags?: number;
    limit_games?: number;
  };
  filters?: {
    gameId?: string;
    tagId?: string;
    genreId?: string;
    platformId?: string;
    sourceId?: string;
  };
};

export async function POST(request: Request): Promise<Response> {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { reportType, periodStart, periodEnd, options = {}, filters } = body;
  const isExecutiveSummary = reportType === "executive_summary";
  if (!reportType) {
    return Response.json({ error: "Obrigatório: reportType" }, { status: 400 });
  }
  if (!isExecutiveSummary && (!periodStart || !periodEnd)) {
    return Response.json(
      { error: "Obrigatório: periodStart, periodEnd" },
      { status: 400 }
    );
  }
  if (isExecutiveSummary && !periodEnd) {
    return Response.json(
      { error: "Resumo executivo exige periodEnd (data de referência)" },
      { status: 400 }
    );
  }
  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    return Response.json(
      { error: `reportType deve ser um de: ${SUPPORTED_REPORT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const end = new Date(periodEnd ?? "");
  const start = periodStart ? new Date(periodStart) : new Date(end);
  if (isExecutiveSummary) {
    start.setTime(end.getTime());
    start.setUTCDate(start.getUTCDate() - 90);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json(
      { error: "periodStart e periodEnd devem ser datas válidas (ISO 8601)" },
      { status: 400 }
    );
  }
  if (start > end) {
    return Response.json({ error: "periodStart deve ser anterior a periodEnd" }, { status: 400 });
  }

  const periodStartFinal = isExecutiveSummary ? start.toISOString().slice(0, 10) : periodStart;
  const periodEndFinal = periodEnd ?? end.toISOString().slice(0, 10);

  const repo = createReportRepository();
  const reportFilters = filters
    ? {
        ...(filters.gameId && { gameId: filters.gameId }),
        ...(filters.tagId && { tagId: filters.tagId }),
        ...(filters.genreId && { genreId: filters.genreId }),
        ...(filters.platformId && { platformId: filters.platformId }),
        ...(filters.sourceId && { sourceId: filters.sourceId }),
      }
    : undefined;

  let reportId: string;
  try {
    reportId = await repo.createReport({
      report_type: reportType,
      period_start: periodStartFinal,
      period_end: periodEndFinal,
      parameters: { ...options, filters: reportFilters },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Falha ao criar registro do relatório: ${msg}` }, { status: 500 });
  }

  try {
    if (reportType === "by_tags") {
      const tagCounts = await repo.getTagCountsForReports(periodStart, periodEnd, reportFilters);
      const payload = generateReportPayload(
        reportType,
        { articles: [], videos: [], sourceNames: new Map(), tagCounts },
        { limit_tags: options.limit_tags }
      );
      await repo.saveReportResult(reportId, payload);
    } else if (reportType === "top_games") {
      const gameCounts = await repo.getGameCountsForReports(periodStartFinal, periodEndFinal, reportFilters);
      const payload = generateReportPayload(
        reportType,
        { articles: [], videos: [], sourceNames: new Map(), gameCounts },
        { limit_games: options.limit_games }
      );
      await repo.saveReportResult(reportId, payload);
    } else if (reportType === "executive_summary") {
      const refDate = new Date(periodEndFinal);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      const start7 = new Date(refDate);
      start7.setUTCDate(start7.getUTCDate() - 6);
      const start30 = new Date(refDate);
      start30.setUTCDate(start30.getUTCDate() - 29);
      const start90 = new Date(refDate);
      start90.setUTCDate(start90.getUTCDate() - 89);

      const [sourceNames, articles7, videos7, gameCounts7, articles30, videos30, gameCounts30, articles90, videos90, gameCounts90] =
        await Promise.all([
          repo.getSourceIdToName(),
          repo.getArticlesForReports(toIso(start7), periodEndFinal, reportFilters),
          repo.getVideosForReports(toIso(start7), periodEndFinal, reportFilters),
          repo.getGameCountsForReports(toIso(start7), periodEndFinal, reportFilters),
          repo.getArticlesForReports(toIso(start30), periodEndFinal, reportFilters),
          repo.getVideosForReports(toIso(start30), periodEndFinal, reportFilters),
          repo.getGameCountsForReports(toIso(start30), periodEndFinal, reportFilters),
          repo.getArticlesForReports(toIso(start90), periodEndFinal, reportFilters),
          repo.getVideosForReports(toIso(start90), periodEndFinal, reportFilters),
          repo.getGameCountsForReports(toIso(start90), periodEndFinal, reportFilters),
        ]);

      const payload = generateExecutiveSummaryReport(
        periodEndFinal,
        { articles: articles7, videos: videos7, sourceNames, gameCounts: gameCounts7 },
        { articles: articles30, videos: videos30, sourceNames, gameCounts: gameCounts30 },
        { articles: articles90, videos: videos90, sourceNames, gameCounts: gameCounts90 }
      );
      await repo.saveReportResult(reportId, payload as unknown as Record<string, unknown>);
    } else {
      const [articles, videos, sourceNames] = await Promise.all([
        repo.getArticlesForReports(periodStartFinal, periodEndFinal, reportFilters),
        repo.getVideosForReports(periodStartFinal, periodEndFinal, reportFilters),
        repo.getSourceIdToName(),
      ]);

      let tagCounts:
        | Array<{ tag_id: string; tag_name: string; count: number }>
        | undefined;

      if (reportType === "by_source_detail") {
        tagCounts = await repo.getTagCountsForReports(periodStartFinal, periodEndFinal, reportFilters);
      }

      const payload = generateReportPayload(
        reportType,
        {
          articles,
          videos,
          sourceNames,
          ...(reportType === "by_source_detail"
            ? { tagCounts, sourceId: reportFilters?.sourceId ?? "" }
            : {}),
        },
        {
          group_by: options.group_by,
          limit_sources: options.limit_sources,
          limit_tags: options.limit_tags,
          limit_games: options.limit_games,
        }
      );
      await repo.saveReportResult(reportId, payload);
    }

    await repo.updateReportStatus(reportId, "completed", { generated_at: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await repo.updateReportStatus(reportId, "failed", { error_message: msg, generated_at: new Date().toISOString() });
    return Response.json({ error: `Falha ao gerar relatório: ${msg}`, reportId }, { status: 500 });
  }

  return Response.json({ reportId, status: "completed", periodStart: periodStartFinal, periodEnd: periodEndFinal, reportType }, { status: 201 });
}

