"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, ChevronRight } from "lucide-react";
import { PageBackLink } from "../components/PageBackLink";
import { AdminPageTitle } from "../admin/components/AdminPageTitle";
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
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPE_ORDER,
  getReportTypeMeta,
} from "@/src/reports/report-type-meta";

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
  subjects: CatalogItem[];
  tags: CatalogItem[];
  types: CatalogItem[];
}

interface SourceItem {
  id: string;
  name: string;
  provider?: "rss" | "youtube";
  language: string;
  isActive: boolean;
}

const MONTH_OPTIONS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
};

export function ReportsClient() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type")?.trim() || "volume";

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = String(now.getUTCMonth() + 1).padStart(2, "0");
  const yearOptions = Array.from({ length: 8 }, (_, i) => String(currentYear - i));

  const [items, setItems] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    reportType: REPORT_TYPE_LABELS[initialType] ? initialType : "volume",
    periodStart: "",
    periodEnd: "",
    monthPresentationYear: String(currentYear),
    monthPresentationMonth: currentMonth,
    groupBy: "day",
    limitSources: 20,
    limitTags: 100,
    limitSubjects: 20,
    filterSubjectId: "",
    filterTagId: "",
    filterTypeId: "",

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
      .catch(() => setCatalogs({ subjects: [], tags: [], types: [] }));
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

    if (
      form.reportType === "month_presentation" &&
      (!form.monthPresentationYear || !form.monthPresentationMonth)
    ) {
      setGenerateError("Selecione ano e mês para a apresentação mensal.");
      setGenerateLoading(false);
      return;
    }

    const periodFromMonth = (() => {
      if (form.reportType !== "month_presentation") return null;
      const yearRaw = form.monthPresentationYear;
      const monthRaw = form.monthPresentationMonth;
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
      const firstDay = `${yearRaw}-${String(month).padStart(2, "0")}-01`;
      const lastDate = new Date(Date.UTC(year, month, 0));
      const lastDay = lastDate.toISOString().slice(0, 10);
      return { firstDay, lastDay };
    })();

    if (form.reportType === "month_presentation" && !periodFromMonth) {
      setGenerateError("Mês inválido para apresentação mensal.");
      setGenerateLoading(false);
      return;
    }

    const body: Record<string, unknown> = {
      reportType: form.reportType,
      periodStart:
        form.reportType === "executive_summary"
          ? form.periodEnd
          : form.reportType === "month_presentation"
            ? periodFromMonth!.firstDay
            : form.periodStart,
      periodEnd:
        form.reportType === "month_presentation"
          ? periodFromMonth!.lastDay
          : form.periodEnd,
    };
    if (form.reportType === "volume") {
      body.options = { group_by: form.groupBy };
    } else if (form.reportType === "top_sources") {
      body.options = { limit_sources: form.limitSources };
    } else if (form.reportType === "by_tags") {
      body.options = { limit_tags: form.limitTags };
    } else if (
      form.reportType === "top_subjects" ||
      form.reportType === "radar_pauta" ||
      form.reportType === "mapa_tematico"
    ) {
      body.options = { limit_subjects: form.limitSubjects };
    }
    if (
      form.filterSubjectId ||
      form.filterTagId ||
      form.filterTypeId ||
      form.sourceId
    ) {
      body.filters = {
        ...(form.filterSubjectId && { subjectId: form.filterSubjectId }),
        ...(form.filterTagId && { tagId: form.filterTagId }),
        ...(form.filterTypeId && { typeId: form.filterTypeId }),

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
      <PageBackLink href="/admin">Início</PageBackLink>
      <AdminPageTitle icon={BarChart3} as="h2">
        Relatórios
      </AdminPageTitle>
      <p className="text-muted-foreground">
        Abra um relatório salvo ou gere um novo para pauta e roteiro.
      </p>

      <Card className="border-border/70">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Relatórios gerados</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique em um card para abrir a visão completa.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtro por tipo"
          >
            <TypeFilterChip
              active={!typeFilter}
              label="Todos"
              onClick={() => {
                setTypeFilter("");
                setPage(1);
              }}
            />
            {REPORT_TYPE_ORDER.map((key) => {
              const meta = getReportTypeMeta(key);
              const Icon = meta.icon;
              return (
                <TypeFilterChip
                  key={key}
                  active={typeFilter === key}
                  label={meta.label}
                  onClick={() => {
                    setTypeFilter(key);
                    setPage(1);
                  }}
                >
                  <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                </TypeFilterChip>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum relatório ainda. Gere um abaixo.
            </p>
          ) : (
            <>
              <div
                className="report-gallery grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="report-gallery"
              >
                {items.map((r) => (
                  <ReportGalleryCard key={r.id} report={r} />
                ))}
              </div>
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
                    <SelectItem value="top_subjects">
                      Top assuntos por período
                    </SelectItem>
                    <SelectItem value="radar_pauta">Radar de pauta</SelectItem>
                    <SelectItem value="mapa_tematico">Mapa temático</SelectItem>
                    <SelectItem value="executive_summary">
                      Resumo executivo
                    </SelectItem>
                    <SelectItem value="month_presentation">
                      Apresentação mensal
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.reportType === "month_presentation" ? (
                <>
                  <div className="space-y-2">
                    <Label>Ano de referência</Label>
                    <Select
                      value={form.monthPresentationYear}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, monthPresentationYear: value ?? String(currentYear) }))
                      }
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mês de referência</Label>
                    <Select
                      value={form.monthPresentationMonth}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, monthPresentationMonth: value ?? currentMonth }))
                      }
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_OPTIONS.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : form.reportType !== "executive_summary" ? (
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
              ) : form.reportType === "top_subjects" ||
                form.reportType === "radar_pauta" ||
                form.reportType === "mapa_tematico" ? (
                <div className="space-y-2">
                    <Label>
                      {form.reportType === "mapa_tematico"
                        ? "Limite de assuntos por cluster"
                        : "Limite de assuntos"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.limitSubjects}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          limitSubjects: Number(e.target.value) || 20,
                        }))
                      }
                    />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Select
                  value={form.filterSubjectId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterSubjectId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {catalogs?.subjects.map((g) => (
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
                <Label>Tipo</Label>
                <Select
                  value={form.filterTypeId}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, filterTypeId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {catalogs?.types.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
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
              <p className="text-sm text-success">{generateSuccess}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

    </section>
  );
}

function TypeFilterChip({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/50 bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-foreground"
          : "border-border/70 bg-card/60 text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
      aria-pressed={active}
    >
      {children}
      <span className="max-w-[9rem] truncate sm:max-w-none">{label}</span>
    </button>
  );
}

function ReportGalleryCard({ report: r }: { report: ReportListItem }) {
  const meta = getReportTypeMeta(r.report_type);
  const Icon = meta.icon;

  return (
    <Link
      href={`/admin/reports/${r.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border p-4 no-underline transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        meta.accentClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
            "bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.25))]",
            "shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]"
          )}
        >
          <Icon className="size-5 text-primary" aria-hidden />
        </span>
        <Badge variant={statusVariant(r.status)} className="shrink-0 font-normal capitalize">
          {r.status === "completed"
            ? "pronto"
            : r.status === "failed"
              ? "falhou"
              : r.status}
        </Badge>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold leading-snug text-foreground">
          {meta.label}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{meta.blurb}</p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/40 pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p className="tabular-nums text-foreground/90">
            {formatYMDAsPTBR(r.period_start)} – {formatYMDAsPTBR(r.period_end)}
          </p>
          {r.generated_at ? (
            <p className="mt-0.5 truncate">
              {new Date(r.generated_at).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
          Abrir
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </Link>
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
