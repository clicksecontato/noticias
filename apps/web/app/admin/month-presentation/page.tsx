import { MonthPresentationClient } from "./MonthPresentationClient";
import { createReportRepository } from "../../../../../packages/database/src/report-repository";

export const metadata = {
  title: "Apresentação do Mês",
  description:
    "Resumo executivo mensal com dados de audiência e oportunidades comerciais para marcas, criadores e parceiros de conteúdo.",
};

async function getLatestMonthPresentationReport() {
  const repo = createReportRepository();
  const { items } = await repo.listReports({
    type: "month_presentation",
    status: "completed",
    page: 1,
    pageSize: 1,
  });
  const latest = items[0];
  if (!latest) return null;
  return repo.getReportById(latest.id);
}

export default async function AdminMonthPresentationPage() {
  const report = await getLatestMonthPresentationReport();
  return (
    <MonthPresentationClient
      reportId={report?.id ?? null}
      reportPayload={(report?.result?.payload as Record<string, unknown> | undefined) ?? null}
      periodStart={report?.period_start ?? null}
      periodEnd={report?.period_end ?? null}
    />
  );
}

