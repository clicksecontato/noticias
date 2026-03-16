import Link from "next/link";
import { createReportRepository } from "../../../../../packages/database/src/report-repository";
import { PageBackLink } from "../../components/PageBackLink";
import { TagsChart } from "../../components/reports/TagsChart";
import { TopSourcesChart } from "../../components/reports/TopSourcesChart";
import { VolumeChart } from "../../components/reports/VolumeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORT_TYPE_LABELS: Record<string, string> = {
  volume: "Volume por período",
  top_sources: "Ranking de fontes",
  by_tags: "Por tags",
};

async function getReport(id: string) {
  const repo = createReportRepository();
  const report = await repo.getReportById(id);
  if (!report) return null;
  return {
    id: report.id,
    reportType: report.report_type,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    parameters: report.parameters,
    status: report.status,
    errorMessage: report.error_message,
    generatedAt: report.generated_at,
    createdAt: report.created_at,
    result: report.result?.payload ?? null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Relatório" };
  const label = REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  return {
    title: `${label} – ${report.periodStart} a ${report.periodEnd}`,
    description: `Relatório: ${label}`,
  };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return (
      <section className="space-y-4">
        <PageBackLink href="/reports">← Relatórios</PageBackLink>
        <p className="text-muted-foreground">Relatório não encontrado.</p>
      </section>
    );
  }

  const label = REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  const result = report.result as Record<string, unknown> | null;

  return (
    <section className="space-y-6">
      <PageBackLink href="/reports">← Relatórios</PageBackLink>
      <h2 className="text-2xl font-semibold">{label}</h2>
      <p className="text-muted-foreground">
        Período: {new Date(report.periodStart).toLocaleDateString("pt-BR")} a{" "}
        {new Date(report.periodEnd).toLocaleDateString("pt-BR")}
      </p>
      <p className="text-sm text-muted-foreground">
        Status: <strong>{report.status}</strong>
        {report.generatedAt
          ? ` · Gerado em ${new Date(report.generatedAt).toLocaleString("pt-BR")}`
          : null}
      </p>
      {report.errorMessage ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4">
            <strong className="text-destructive">Erro:</strong>{" "}
            <span className="text-destructive/90">{report.errorMessage}</span>
          </CardContent>
        </Card>
      ) : null}
      {result && report.status === "completed" ? (
        <ReportPayload type={report.reportType} payload={result} />
      ) : null}
    </section>
  );
}

function ReportPayload({
  type,
  payload,
}: {
  type: string;
  payload: Record<string, unknown>;
}) {
  if (type === "volume") {
    const rawSeries =
      (payload.series as Array<{
        date: string;
        articles: number;
        videos: number;
      }>) ?? [];
    const series = rawSeries.map((row) => ({
      ...row,
      total: row.articles + row.videos,
    }));
    const totals = (payload.totals as { articles: number; videos: number }) ?? {
      articles: 0,
      videos: 0,
    };
    const groupBy = (payload.group_by as string) ?? "day";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Totais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-muted-foreground">
            <strong className="text-foreground">{totals.articles}</strong> artigos
            · <strong className="text-foreground">{totals.videos}</strong> vídeos
          </p>
          <h3 className="text-lg font-semibold">
            Série (
            {groupBy === "day"
              ? "por dia"
              : groupBy === "week"
                ? "por semana"
                : "por mês"}
            )
          </h3>
          <VolumeChart data={series} groupBy={groupBy} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {series.map((row) => (
                  <tr key={row.date} className="border-b border-border">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right">
                      {row.articles + row.videos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "top_sources") {
    const items =
      (payload.items as Array<{
        source_id: string;
        source_name: string;
        articles: number;
        videos: number;
        total: number;
      }>) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de fontes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <TopSourcesChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Fonte</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.source_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.source_name}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "by_tags") {
    const items =
      (payload.items as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notícias por tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Quantidade de notícias (artigos) associadas a cada tag no período. Fontes não exibidas.
          </p>
          <TagsChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Tag</th>
                  <th className="p-3 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.tag_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.tag_name}</td>
                    <td className="p-3 text-right font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
