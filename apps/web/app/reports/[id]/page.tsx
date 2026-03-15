import Link from "next/link";
import { createReportRepository } from "../../../../../packages/database/src/report-repository";

type MaybePromise<T> = T | Promise<T>;

const REPORT_TYPE_LABELS: Record<string, string> = {
  volume: "Volume por período",
  top_sources: "Ranking de fontes"
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
    result: report.result?.payload ?? null
  };
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Relatório" };
  const label = REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  return {
    title: `${label} – ${report.periodStart} a ${report.periodEnd}`,
    description: `Relatório: ${label}`
  };
}

export default async function ReportDetailPage({
  params
}: {
  params: MaybePromise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return (
      <section>
        <p className="page-back">
          <Link href="/reports">← Relatórios</Link>
        </p>
        <p>Relatório não encontrado.</p>
      </section>
    );
  }

  const label = REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  const result = report.result as Record<string, unknown> | null;

  return (
    <section>
      <p className="page-back">
        <Link href="/reports">← Relatórios</Link>
      </p>
      <h2>{label}</h2>
      <p>
        Período: {new Date(report.periodStart).toLocaleDateString("pt-BR")} a{" "}
        {new Date(report.periodEnd).toLocaleDateString("pt-BR")}
      </p>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Status: <strong>{report.status}</strong>
        {report.generatedAt
          ? ` · Gerado em ${new Date(report.generatedAt).toLocaleString("pt-BR")}`
          : null}
      </p>
      {report.errorMessage ? (
        <div className="card" style={{ background: "#7f1d1d", color: "#fecaca" }}>
          <strong>Erro:</strong> {report.errorMessage}
        </div>
      ) : null}
      {result && report.status === "completed" ? (
        <ReportPayload type={report.reportType} payload={result} />
      ) : null}
    </section>
  );
}

function ReportPayload({
  type,
  payload
}: {
  type: string;
  payload: Record<string, unknown>;
}) {
  if (type === "volume") {
    const series = (payload.series as Array<{ date: string; articles: number; videos: number }>) ?? [];
    const totals = (payload.totals as { articles: number; videos: number }) ?? { articles: 0, videos: 0 };
    const groupBy = (payload.group_by as string) ?? "day";
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Totais</h3>
        <p>
          <strong>{totals.articles}</strong> artigos · <strong>{totals.videos}</strong> vídeos
        </p>
        <h3>Série ({groupBy === "day" ? "por dia" : groupBy === "week" ? "por semana" : "por mês"})</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Data</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Artigos</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Vídeos</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={row.date} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "8px 12px" }}>{row.date}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px" }}>{row.articles}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px" }}>{row.videos}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px" }}>{row.articles + row.videos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "top_sources") {
    const items = (payload.items as Array<{
      source_id: string;
      source_name: string;
      articles: number;
      videos: number;
      total: number;
    }>) ?? [];
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ranking de fontes</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>#</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Fonte</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Artigos</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Vídeos</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={row.source_id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "8px 12px" }}>{i + 1}</td>
                  <td style={{ padding: "8px 12px" }}>{row.source_name}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px" }}>{row.articles}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px" }}>{row.videos}</td>
                  <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600 }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <pre style={{ margin: 0, padding: 12, background: "#0f172a", borderRadius: 8, overflow: "auto", fontSize: 12 }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
