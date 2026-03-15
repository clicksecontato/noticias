"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ReportListItem {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  generated_at: string | null;
  created_at: string;
}

interface CatalogItem {
  id: string;
  name: string;
  slug: string;
}

interface Catalogs {
  games: CatalogItem[];
  tags: CatalogItem[];
  genres: CatalogItem[];
  platforms: CatalogItem[];
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  volume: "Volume por período",
  top_sources: "Ranking de fontes"
};

export function ReportsClient() {
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    reportType: "volume",
    periodStart: "",
    periodEnd: "",
    groupBy: "day",
    limitSources: 20,
    filterGameId: "",
    filterTagId: "",
    filterGenreId: "",
    filterPlatformId: ""
  });

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetch("/api/catalogs")
      .then((res) => res.json())
      .then((data: Catalogs) => setCatalogs(data))
      .catch(() => setCatalogs({ games: [], tags: [], genres: [], platforms: [] }));
  }, []);

  function loadReports() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/reports?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { items: ReportListItem[]; total: number }) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReports();
  }, [page, typeFilter]);

  async function onSubmitGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerateError(null);
    setGenerateSuccess(null);
    setGenerateLoading(true);
    const body: Record<string, unknown> = {
      reportType: form.reportType,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd
    };
    if (form.reportType === "volume") {
      body.options = { group_by: form.groupBy };
    } else {
      body.options = { limit_sources: form.limitSources };
    }
    if (form.filterGameId || form.filterTagId || form.filterGenreId || form.filterPlatformId) {
      body.filters = {
        ...(form.filterGameId && { gameId: form.filterGameId }),
        ...(form.filterTagId && { tagId: form.filterTagId }),
        ...(form.filterGenreId && { genreId: form.filterGenreId }),
        ...(form.filterPlatformId && { platformId: form.filterPlatformId })
      };
    }
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Erro ao gerar relatório.");
        return;
      }
      setGenerateSuccess(`Relatório gerado: ${data.reportId}`);
      loadReports();
      setForm((f) => ({ ...f, periodStart: "", periodEnd: "" }));
    } catch {
      setGenerateError("Erro ao chamar a API.");
    } finally {
      setGenerateLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section>
      <p className="page-back">
        <Link href="/">← Início</Link>
      </p>
      <h2>Relatórios</h2>
      <p>Dados sobre publicações (artigos e vídeos) dos principais canais de games no Brasil.</p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Gerar novo relatório</h3>
        <form onSubmit={onSubmitGenerate}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Tipo
              <select
                value={form.reportType}
                onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
                style={{ padding: 8 }}
              >
                <option value="volume">Volume por período</option>
                <option value="top_sources">Ranking de fontes</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Início do período
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                required
                style={{ padding: 8 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Fim do período
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                required
                style={{ padding: 8 }}
              />
            </label>
            {form.reportType === "volume" ? (
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                Agrupar por
                <select
                  value={form.groupBy}
                  onChange={(e) => setForm((f) => ({ ...f, groupBy: e.target.value }))}
                  style={{ padding: 8 }}
                >
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                </select>
              </label>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                Limite de fontes
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={form.limitSources}
                  onChange={(e) => setForm((f) => ({ ...f, limitSources: Number(e.target.value) || 20 }))}
                  style={{ padding: 8 }}
                />
              </label>
            )}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Jogo
              <select
                value={form.filterGameId}
                onChange={(e) => setForm((f) => ({ ...f, filterGameId: e.target.value }))}
                style={{ padding: 8 }}
              >
                <option value="">Todos</option>
                {catalogs?.games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Tag
              <select
                value={form.filterTagId}
                onChange={(e) => setForm((f) => ({ ...f, filterTagId: e.target.value }))}
                style={{ padding: 8 }}
              >
                <option value="">Todas</option>
                {catalogs?.tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Gênero
              <select
                value={form.filterGenreId}
                onChange={(e) => setForm((f) => ({ ...f, filterGenreId: e.target.value }))}
                style={{ padding: 8 }}
              >
                <option value="">Todos</option>
                {catalogs?.genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              Plataforma
              <select
                value={form.filterPlatformId}
                onChange={(e) => setForm((f) => ({ ...f, filterPlatformId: e.target.value }))}
                style={{ padding: 8 }}
              >
                <option value="">Todas</option>
                {catalogs?.platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={generateLoading}>
            {generateLoading ? "Gerando…" : "Gerar relatório"}
          </button>
          {generateError ? <p style={{ color: "#f87171", marginTop: 8 }}>{generateError}</p> : null}
          {generateSuccess ? <p style={{ color: "#4ade80", marginTop: 8 }}>{generateSuccess}</p> : null}
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Relatórios gerados</h3>
        <p style={{ marginBottom: 8 }}>
          Filtrar por tipo:{" "}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: 6 }}
          >
            <option value="">Todos</option>
            <option value="volume">Volume</option>
            <option value="top_sources">Ranking de fontes</option>
          </select>
        </p>
        {loading ? (
          <p>Carregando…</p>
        ) : items.length === 0 ? (
          <p>Nenhum relatório ainda. Gere um acima.</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #334155"
                  }}
                >
                  <Link href={`/reports/${r.id}`} style={{ fontWeight: 600 }}>
                    {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                  </Link>
                  <span style={{ color: "#94a3b8", marginLeft: 8 }}>
                    {new Date(r.period_start).toLocaleDateString("pt-BR")} – {new Date(r.period_end).toLocaleDateString("pt-BR")}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      background: r.status === "completed" ? "#166534" : r.status === "failed" ? "#991b1b" : "#854d0e",
                      color: "#fff"
                    }}
                  >
                    {r.status}
                  </span>
                  {r.generated_at ? (
                    <span style={{ marginLeft: 8, fontSize: 13, color: "#64748b" }}>
                      Gerado em {new Date(r.generated_at).toLocaleString("pt-BR")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <nav className="pagination" aria-label="Paginação" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="chip"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="chip muted">
                Página {page} de {totalPages} ({total} total)
              </span>
              <button
                type="button"
                className="chip"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
