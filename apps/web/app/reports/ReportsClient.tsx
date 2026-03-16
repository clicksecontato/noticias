"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageBackLink } from "../components/PageBackLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  top_sources: "Ranking de fontes",
  by_tags: "Por tags",
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
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
    limitTags: 100,
    filterGameId: "",
    filterTagId: "",
    filterGenreId: "",
    filterPlatformId: "",
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
      periodEnd: form.periodEnd,
    };
    if (form.reportType === "volume") {
      body.options = { group_by: form.groupBy };
    } else if (form.reportType === "top_sources") {
      body.options = { limit_sources: form.limitSources };
    } else if (form.reportType === "by_tags") {
      body.options = { limit_tags: form.limitTags };
    }
    if (
      form.filterGameId ||
      form.filterTagId ||
      form.filterGenreId ||
      form.filterPlatformId
    ) {
      body.filters = {
        ...(form.filterGameId && { gameId: form.filterGameId }),
        ...(form.filterTagId && { tagId: form.filterTagId }),
        ...(form.filterGenreId && { genreId: form.filterGenreId }),
        ...(form.filterPlatformId && { platformId: form.filterPlatformId }),
      };
    }
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <section className="space-y-6">
      <PageBackLink href="/">← Início</PageBackLink>
      <h2 className="text-2xl font-semibold">Relatórios</h2>
      <p className="text-muted-foreground">
        Dados sobre publicações (artigos e vídeos) dos principais canais de games no Brasil.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerar novo relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitGenerate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={form.reportType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reportType: e.target.value }))
                  }
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    "dark:bg-input/30"
                  )}
                >
                  <option value="volume">Volume por período</option>
                  <option value="top_sources">Ranking de fontes</option>
                  <option value="by_tags">Por tags</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Início do período</Label>
                <Input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, periodStart: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fim do período</Label>
                <Input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, periodEnd: e.target.value }))
                  }
                  required
                />
              </div>
              {form.reportType === "volume" ? (
                <div className="space-y-2">
                  <Label>Agrupar por</Label>
                  <select
                    value={form.groupBy}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, groupBy: e.target.value }))
                    }
                    className={cn(
                      "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                      "dark:bg-input/30"
                    )}
                  >
                    <option value="day">Dia</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                  </select>
                </div>
              ) : form.reportType === "top_sources" ? (
                <div className="space-y-2">
                  <Label>Limite de fontes</Label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={form.limitSources}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        limitSources: Number(e.target.value) || 20,
                      }))
                    }
                  />
                </div>
              ) : form.reportType === "by_tags" ? (
                <div className="space-y-2">
                  <Label>Limite de tags</Label>
                  <Input
                    type="number"
                    min={10}
                    max={200}
                    value={form.limitTags}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        limitTags: Number(e.target.value) || 100,
                      }))
                    }
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Jogo</Label>
                <select
                  value={form.filterGameId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, filterGameId: e.target.value }))
                  }
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    "dark:bg-input/30"
                  )}
                >
                  <option value="">Todos</option>
                  {catalogs?.games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tag</Label>
                <select
                  value={form.filterTagId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, filterTagId: e.target.value }))
                  }
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    "dark:bg-input/30"
                  )}
                >
                  <option value="">Todas</option>
                  {catalogs?.tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <select
                  value={form.filterGenreId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, filterGenreId: e.target.value }))
                  }
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    "dark:bg-input/30"
                  )}
                >
                  <option value="">Todos</option>
                  {catalogs?.genres.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <select
                  value={form.filterPlatformId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, filterPlatformId: e.target.value }))
                  }
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    "dark:bg-input/30"
                  )}
                >
                  <option value="">Todas</option>
                  {catalogs?.platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={generateLoading}>
              {generateLoading ? "Gerando…" : "Gerar relatório"}
            </Button>
            {generateError ? (
              <p className="text-sm text-destructive">{generateError}</p>
            ) : null}
            {generateSuccess ? (
              <p className="text-sm text-primary">{generateSuccess}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios gerados</CardTitle>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Label className="sr-only">Filtrar por tipo</Label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className={cn(
                "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                "dark:bg-input/30"
              )}
            >
              <option value="">Todos</option>
              <option value="volume">Volume</option>
              <option value="top_sources">Ranking de fontes</option>
              <option value="by_tags">Por tags</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum relatório ainda. Gere um acima.
            </p>
          ) : (
            <>
              <ul className="list-none space-y-0 p-0">
                {items.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 border-b border-border py-3 last:border-0"
                  >
                    <Link
                      href={`/reports/${r.id}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {new Date(r.period_start).toLocaleDateString("pt-BR")} –{" "}
                      {new Date(r.period_end).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant={statusVariant(r.status)} className="font-normal">
                      {r.status}
                    </Badge>
                    {r.generated_at ? (
                      <span className="text-xs text-muted-foreground">
                        Gerado em{" "}
                        {new Date(r.generated_at).toLocaleString("pt-BR")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label="Paginação">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="px-2 text-sm text-muted-foreground" aria-live="polite">
                  Página {page} de {totalPages} ({total} total)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </nav>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
