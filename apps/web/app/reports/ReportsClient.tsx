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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

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

interface SourceItem {
  id: string;
  name: string;
  provider?: "rss" | "youtube";
  language: string;
  isActive: boolean;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  volume: "Volume por período",
  top_sources: "Ranking de fontes",
  by_tags: "Por tags",
  activity_by_weekday: "Atividade por dia da semana",
  by_source_detail: "Detalhe por fonte",
  top_games: "Top jogos por período",
  executive_summary: "Resumo executivo",
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
    limitGames: 20,
    filterGameId: "",
    filterTagId: "",
    filterGenreId: "",
    filterPlatformId: "",
    sourceId: "",
  });

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const pageSize = 10;

  useEffect(() => {
    fetch("/api/catalogs")
      .then((res) => res.json())
      .then((data: Catalogs) => setCatalogs(data))
      .catch(() => setCatalogs({ games: [], tags: [], genres: [], platforms: [] }));
  }, []);

  useEffect(() => {
    // Carrega fontes para o dropdown de detalhe por fonte
    fetch("/api/admin/sources")
      .then((res) => res.json())
      .then((data: { sources?: SourceItem[] }) => {
        setSources(data.sources ?? []);
      })
      .catch(() => setSources([]));
  }, []);

  function loadReports() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/admin/reports?${params.toString()}`)
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
    if (form.reportType === "by_source_detail" && !form.sourceId) {
      setGenerateError("Selecione uma fonte para o relatório de detalhe por fonte.");
      setGenerateLoading(false);
      return;
    }
    if (form.reportType === "executive_summary" && !form.periodEnd) {
      setGenerateError("Informe a data de referência para o resumo executivo.");
      setGenerateLoading(false);
      return;
    }
    const body: Record<string, unknown> = {
      reportType: form.reportType,
      periodStart: form.reportType === "executive_summary" ? form.periodEnd : form.periodStart,
      periodEnd: form.periodEnd,
    };
    if (form.reportType === "volume") {
      body.options = { group_by: form.groupBy };
    } else if (form.reportType === "top_sources") {
      body.options = { limit_sources: form.limitSources };
    } else if (form.reportType === "by_tags") {
      body.options = { limit_tags: form.limitTags };
    } else if (form.reportType === "top_games") {
      body.options = { limit_games: form.limitGames };
    }
    if (
      form.filterGameId ||
      form.filterTagId ||
      form.filterGenreId ||
      form.filterPlatformId ||
      form.sourceId
    ) {
      body.filters = {
        ...(form.filterGameId && { gameId: form.filterGameId }),
        ...(form.filterTagId && { tagId: form.filterTagId }),
        ...(form.filterGenreId && { genreId: form.filterGenreId }),
        ...(form.filterPlatformId && { platformId: form.filterPlatformId }),
        ...(form.sourceId && { sourceId: form.sourceId }),
      };
    }
    try {
      const res = await fetch("/api/admin/reports/generate", {
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
      <PageBackLink href="/admin">← Início</PageBackLink>
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
                <Select
                  value={form.reportType}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, reportType: value ?? "volume" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Volume por período</SelectItem>
                    <SelectItem value="top_sources">Ranking de fontes</SelectItem>
                    <SelectItem value="by_tags">Por tags</SelectItem>
                    <SelectItem value="activity_by_weekday">
                      Atividade por dia da semana
                    </SelectItem>
                    <SelectItem value="by_source_detail">
                      Detalhe por fonte
                    </SelectItem>
                    <SelectItem value="top_games">
                      Top jogos por período
                    </SelectItem>
                    <SelectItem value="executive_summary">
                      Resumo executivo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.reportType !== "executive_summary" ? (
                <>
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
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Data de referência</Label>
                  <Input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodEnd: e.target.value }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Últimos 7, 30 e 90 dias até esta data.
                  </p>
                </div>
              )}
              {form.reportType === "volume" ? (
                <div className="space-y-2">
                  <Label>Agrupar por</Label>
                  <Select
                    value={form.groupBy}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, groupBy: value ?? "day" }))
                    }
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                    </SelectContent>
                  </Select>
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
              ) : form.reportType === "by_source_detail" ? (
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
              ) : form.reportType === "top_games" ? (
                <div className="space-y-2">
                  <Label>Limite de jogos</Label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={form.limitGames}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        limitGames: Number(e.target.value) || 20,
                      }))
                    }
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Jogo</Label>
                <Select
                  value={form.filterGameId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterGameId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {catalogs?.games.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tag</Label>
                <Select
                  value={form.filterTagId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterTagId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {catalogs?.tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.reportType === "by_source_detail" && (
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Combobox
                    value={form.sourceId}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, sourceId: value ?? "" }))
                    }
                  >
                    <ComboboxInput
                      placeholder="Buscar por nome ou ID..."
                      showTrigger
                      showClear={!!form.sourceId}
                      onChange={(event) =>
                        setSourceSearch(event.target.value)
                      }
                    >
                      <ComboboxContent>
                        <ComboboxEmpty>Nenhuma fonte encontrada.</ComboboxEmpty>
                        <ComboboxList>
                          {sources
                            .filter((s) => {
                              if (!sourceSearch.trim()) return true;
                              const q = sourceSearch.toLowerCase();
                              return (
                                s.id.toLowerCase().includes(q) ||
                                s.name.toLowerCase().includes(q)
                              );
                            })
                            .map((s) => (
                              <ComboboxItem
                                key={s.id}
                                value={s.id}
                              >
                                {s.name} ({s.id})
                              </ComboboxItem>
                            ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </ComboboxInput>
                  </Combobox>
                </div>
              )}
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select
                  value={form.filterGenreId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterGenreId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {catalogs?.genres.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={form.filterPlatformId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterPlatformId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {catalogs?.platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-full max-w-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="top_sources">Ranking de fontes</SelectItem>
                  <SelectItem value="by_tags">Por tags</SelectItem>
                  <SelectItem value="activity_by_weekday">
                    Atividade por dia da semana
                  </SelectItem>
                  <SelectItem value="by_source_detail">
                    Detalhe por fonte
                  </SelectItem>
                  <SelectItem value="top_games">Top jogos por período</SelectItem>
                  <SelectItem value="executive_summary">Resumo executivo</SelectItem>
                </SelectContent>
            </Select>
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
                      href={`/admin/reports/${r.id}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatYMDAsPTBR(r.period_start)} – {formatYMDAsPTBR(r.period_end)}
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

function formatYMDAsPTBR(value: string): string {
  // value esperado: "YYYY-MM-DD" (ou ISO completo).
  // Não usar `new Date(value)` para evitar deslocamento por fuso.
  const ymd = value.includes("T") ? value.slice(0, 10) : value;
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}
