import { createReportRepository } from "../../../../../../packages/database/src/report-repository";
import { PageBackLink } from "../../../components/PageBackLink";
import { ReportPayload, formatYMDAsPTBR } from "../../../reports/report-detail-renderers";
import type { ReportWithResult } from "../../../../../../packages/database/src/report-types";
import type { ReportType } from "../../../../../../packages/database/src/report-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORT_TYPE_LABELS: Record<string, string> = {
  volume: "Volume por período",
  top_sources: "Ranking de fontes",
  by_tags: "Por tags",
  by_source_detail: "Detalhe por fonte",
  activity_by_weekday: "Atividade por dia da semana",
  top_games: "Top jogos por período",
  executive_summary: "Resumo executivo",
};

async function getReport(id: string): Promise<ReportWithResult | null> {
  const repo = createReportRepository();
  const report = await repo.getReportById(id);
  return report;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Relatório" };
  const label = REPORT_TYPE_LABELS[report.report_type as ReportType] ?? report.report_type;
  return {
    title: `${label} – ${report.period_start} a ${report.period_end}`,
    description: `Relatório: ${label}`,
  };
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return (
      <section className="space-y-4">
        <PageBackLink href="/admin/reports">← Relatórios</PageBackLink>
        <p className="text-muted-foreground">Relatório não encontrado.</p>
      </section>
    );
  }

  const label = REPORT_TYPE_LABELS[report.report_type as ReportType] ?? report.report_type;
  const result = report.result?.payload ?? null;

  return (
    <section className="space-y-6">
      <PageBackLink href="/admin/reports">← Relatórios</PageBackLink>
      <h2 className="text-2xl font-semibold">{label}</h2>
      <p className="text-muted-foreground">
        Período:{" "}
        {formatYMDAsPTBR(report.period_start)} a{" "}
        {formatYMDAsPTBR(report.period_end)}
      </p>
      <p className="text-sm text-muted-foreground">
        Status: <strong>{report.status}</strong>
        {report.generated_at
          ? ` · Gerado em ${new Date(report.generated_at).toLocaleString("pt-BR")}`
          : null}
      </p>
      {report.error_message ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4">
            <strong className="text-destructive">Erro:</strong>{" "}
            <span className="text-destructive/90">{report.error_message}</span>
          </CardContent>
        </Card>
      ) : null}
      {result && report.status === "completed" ? (
        <ReportPayload type={report.report_type} payload={result as Record<string, unknown>} />
      ) : null}
    </section>
  );
}

