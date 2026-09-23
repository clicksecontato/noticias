"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageBackLink } from "../../components/PageBackLink";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PIE_COLORS } from "@/src/ui/chart-gradients";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";

interface MonthPresentationPayload {
  summary: {
    period_start: string;
    period_end: string;
    sources_total: number;
    sources_rss: number;
    sources_youtube: number;
    contents_total: number;
    articles_total: number;
    videos_total: number;
    links_total: number;
    links_per_content: number;
  };
  source_mix: Array<{ tipo: "RSS" | "YouTube"; fontes: number; conteudos: number; share: number }>;
  monthly_evolution: Array<{ mes: string; conteudos: number; vinculos: number }>;
  link_quality: Array<{
    tipo: "Notícia RSS" | "Vídeo YouTube";
    assuntos: number;
    tags: number;
    tipos: number;
  }>;
  top_clusters: Array<{ cluster: string; citacoes: number }>;
  cadence: Array<{ dia: string; rss: number; youtube: number }>;
  cadence_by_source?: Array<{
    source_id: string;
    source_name: string;
    provider: "rss" | "youtube";
    total: number;
    dias?: Array<{ dia: string; conteudos: number }>;
  }>;
  news_relevance?: {
    articles: { total: number; subjects_context: number; generic: number; pct_subjects: number };
    videos: { total: number; subjects_context: number; generic: number; pct_subjects: number };
    combined: { total: number; subjects_context: number; generic: number; pct_subjects: number };
    by_source: Array<{
      source_id: string;
      source_name: string;
      provider: "rss" | "youtube";
      total: number;
      subjects_context: number;
      generic: number;
      pct_subjects: number;
    }>;
  };
  script: Array<{ title: string; text: string }>;
}

const pieColors = [...PIE_COLORS];

const sourceMixConfig = {
  fontes: { label: "Fontes", color: "var(--chart-1)" },
  conteudos: { label: "Conteúdos", color: "var(--chart-2)" },
} satisfies ChartConfig;

const monthlyEvolutionConfig = {
  conteudos: { label: "Conteúdos", color: "var(--chart-1)" },
  vinculos: { label: "Vínculos", color: "var(--chart-2)" },
} satisfies ChartConfig;

const linkQualityConfig = {
  assuntos: { label: "Assuntos", color: "var(--chart-1)" },
  tags: { label: "Tags", color: "var(--chart-2)" },
  tipos: { label: "Tipos", color: "var(--chart-3)" },
} satisfies ChartConfig;

const cadenceConfig = {
  rss: { label: "RSS", color: "var(--chart-1)" },
  youtube: { label: "YouTube", color: "var(--chart-2)" },
} satisfies ChartConfig;

const newsRelevanceStackConfig = {
  relevantes: { label: "Relevantes (is_news)", color: "var(--chart-1)" },
  genericos: { label: "Genéricos / off-topic", color: "var(--chart-3)" },
} satisfies ChartConfig;

function peakDayLabel(dias: Array<{ dia: string; conteudos: number }>): { label: string; valor: number } {
  let valor = 0;
  let label = "—";
  for (const d of dias) {
    if (d.conteudos > valor) {
      valor = d.conteudos;
      label = d.dia;
    }
  }
  return { label, valor };
}

export function MonthPresentationClient({
  reportId,
  reportPayload,
  periodStart,
  periodEnd,
}: {
  reportId: string | null;
  reportPayload: Record<string, unknown> | null;
  periodStart: string | null;
  periodEnd: string | null;
}) {
  const basePayload = useMemo(
    () => (reportPayload as MonthPresentationPayload | null) ?? null,
    [reportPayload]
  );
  const [filteredPayload, setFilteredPayload] = useState<MonthPresentationPayload | null>(null);
  const [filterProvider, setFilterProvider] = useState<"all" | "rss" | "youtube">("all");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [adminSources, setAdminSources] = useState<
    Array<{ id: string; name: string; provider: string }>
  >([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    setFilteredPayload(null);
    setFilterError(null);
  }, [reportId, reportPayload]);

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((d: { sources?: Array<{ id: string; name: string; provider: string }> }) => {
        if (Array.isArray(d.sources)) setAdminSources(d.sources);
      })
      .catch(() => {});
  }, []);

  const payload = filteredPayload ?? basePayload;
  const sourceMix = payload?.source_mix ?? [];
  const monthlyEvolution = payload?.monthly_evolution ?? [];
  const linkQualityByType = payload?.link_quality ?? [];
  const topEntityClusters = payload?.top_clusters ?? [];
  const cadenceByWeekday = payload?.cadence ?? [];
  const cadenceBySourceRaw = payload?.cadence_by_source ?? [];
  const newsRelevance = payload?.news_relevance ?? null;
  const scripts = payload?.script ?? [];

  const newsRelevanceBarData = useMemo(() => {
    if (!newsRelevance) return [];
    return [
      {
        canal: "RSS",
        relevantes: newsRelevance.articles.subjects_context,
        genericos: newsRelevance.articles.generic,
      },
      {
        canal: "YouTube",
        relevantes: newsRelevance.videos.subjects_context,
        genericos: newsRelevance.videos.generic,
      },
      {
        canal: "Combinado",
        relevantes: newsRelevance.combined.subjects_context,
        genericos: newsRelevance.combined.generic,
      },
    ];
  }, [newsRelevance]);

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  /** Relatórios antigos sem o array `dias` (formato anterior) são ignorados até regenerar. */
  const cadenceBySource = useMemo(() => {
    return cadenceBySourceRaw
      .map((row) => ({ ...row, dias: row.dias ?? [] }))
      .filter((row) => row.dias.length === 7);
  }, [cadenceBySourceRaw]);

  useEffect(() => {
    if (!cadenceBySource.length) {
      setSelectedSourceId(null);
      return;
    }
    if (!selectedSourceId || !cadenceBySource.some((s) => s.source_id === selectedSourceId)) {
      setSelectedSourceId(cadenceBySource[0].source_id);
    }
  }, [cadenceBySource, selectedSourceId]);

  const selectedCadenceSource =
    cadenceBySource.find((s) => s.source_id === selectedSourceId) ?? cadenceBySource[0] ?? null;
  const selectedSourcePeak = selectedCadenceSource
    ? peakDayLabel(selectedCadenceSource.dias)
    : null;

  const sourceWeekdayChartConfig = useMemo(() => {
    const isYt = selectedCadenceSource?.provider === "youtube";
    return {
      conteudos: {
        label: isYt ? "YouTube" : "RSS",
        color: isYt ? "var(--chart-2)" : "var(--chart-1)",
      },
    } satisfies ChartConfig;
  }, [selectedCadenceSource?.provider]);

  const summary = payload?.summary ?? {
    period_start: periodStart ?? "",
    period_end: periodEnd ?? "",
    sources_total: 0,
    sources_rss: 0,
    sources_youtube: 0,
    contents_total: 0,
    articles_total: 0,
    videos_total: 0,
    links_total: 0,
    links_per_content: 0,
  };

  async function applyPresentationFilters() {
    if (!basePayload?.summary?.period_start || !basePayload?.summary?.period_end) {
      setFilterError("Período do relatório indisponível.");
      return;
    }
    setFilterLoading(true);
    setFilterError(null);
    try {
      const res = await fetch("/api/admin/month-presentation/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: basePayload.summary.period_start,
          periodEnd: basePayload.summary.period_end,
          filters: {
            ...(filterProvider !== "all" ? { provider: filterProvider } : {}),
            ...(selectedSourceIds.length > 0 ? { sourceIds: selectedSourceIds } : {}),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFilterError(typeof data.error === "string" ? data.error : "Falha ao aplicar filtros.");
        return;
      }
      if (data.payload) {
        setFilteredPayload(data.payload as MonthPresentationPayload);
      }
    } catch {
      setFilterError("Erro de rede ao aplicar filtros.");
    } finally {
      setFilterLoading(false);
    }
  }

  function resetPresentationFilters() {
    setFilteredPayload(null);
    setFilterProvider("all");
    setSelectedSourceIds([]);
    setFilterError(null);
  }

  function toggleSourceFilter(id: string) {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const headlineKpis = [
    {
      label: "Fontes ativas analisadas",
      value: String(summary.sources_total),
      note: `${summary.sources_rss} RSS e ${summary.sources_youtube} YouTube`,
    },
    {
      label: "Conteúdos classificados",
      value: String(summary.contents_total),
      note: `${summary.articles_total} artigos + ${summary.videos_total} vídeos`,
    },
    {
      label: "Vínculos gerados",
      value: String(summary.links_total),
      note: "assuntos, tags e tipos",
    },
    {
      label: "Densidade de contexto",
      value: String(summary.links_per_content),
      note: "média de vínculos por conteúdo",
    },
  ];

  return (
    <section className="space-y-6">
      <PageBackLink href="/admin">Admin</PageBackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roteiro Visual do Mês (Fontes e Vínculos)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leitura editorial do mês com dados reais: quem publicou, como os conteúdos se conectam
            e quais histórias explicam o período para público leigo e também para quem é do ramo.
          </p>
          {summary.period_start && summary.period_end ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Período do relatório: {summary.period_start} a {summary.period_end}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={reportId ? "default" : "secondary"}>
            {reportId ? "Dados reais gerados" : "Sem relatório gerado"}
          </Badge>
          {filteredPayload ? (
            <Badge variant="outline">Visão filtrada (preview)</Badge>
          ) : null}
          <Button size="sm">Exportar roteiro</Button>
        </div>
      </div>

      {basePayload ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros da apresentação</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Recalcula KPIs e gráficos no servidor para o mesmo período do relatório. Nenhuma fonte
              selecionada = todas as fontes. Combine provedor (RSS/YouTube) e subconjunto de fontes.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-2 sm:w-48">
                <Label htmlFor="mp-provider">Provedor</Label>
                <Select
                  value={filterProvider}
                  onValueChange={(v) => setFilterProvider(v as "all" | "rss" | "youtube")}
                >
                  <SelectTrigger id="mp-provider" className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos (RSS + YouTube)</SelectItem>
                    <SelectItem value="rss">Somente RSS</SelectItem>
                    <SelectItem value="youtube">Somente YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={filterLoading}
                  onClick={() => void applyPresentationFilters()}
                >
                  {filterLoading ? "Aplicando…" : "Aplicar filtros"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={filterLoading}
                  onClick={resetPresentationFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Fontes (opcional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedSourceIds(adminSources.map((s) => s.id))}
                  >
                    Marcar todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedSourceIds([])}
                  >
                    Limpar fontes
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                {adminSources.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Carregando lista de fontes…</p>
                ) : (
                  adminSources.map((s) => {
                    const on = selectedSourceIds.includes(s.id);
                    return (
                      <Button
                        key={s.id}
                        type="button"
                        variant={on ? "secondary" : "ghost"}
                        size="sm"
                        className="h-auto w-full justify-start py-1.5 text-left font-normal"
                        onClick={() => toggleSourceFilter(s.id)}
                      >
                        <span className="truncate">
                          {on ? "✓ " : ""}
                          {s.name}
                          <span className="text-muted-foreground">
                            {" "}
                            ({s.provider === "youtube" ? "YouTube" : "RSS"})
                          </span>
                        </span>
                      </Button>
                    );
                  })
                )}
              </div>
            </div>
            {filterError ? (
              <p className="text-sm text-destructive">{filterError}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!payload ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum relatório gerado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Gere um relatório do tipo <strong className="text-foreground">month-presentation</strong> em
            <strong className="text-foreground"> /admin/reports</strong> para preencher esta página com dados reais.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headlineKpis.map((kpi, idx) => (
          <Card
            key={kpi.label}
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <CardHeader>
          <CardTitle>Resumo em 30 segundos (para abrir o vídeo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            No período, acompanhamos{" "}
            <strong className="text-foreground">{summary.sources_total} fontes</strong> e classificamos{" "}
            <strong className="text-foreground">{summary.contents_total} conteúdos</strong>. O destaque é a
            profundidade: <strong className="text-foreground">{summary.links_total} vínculos editoriais</strong>,
            com média de <strong className="text-foreground">{summary.links_per_content}</strong> vínculos por
            peça.
          </p>
          <p>
            Para quem é leigo: isso significa conteúdo mais organizado e fácil de entender. Para quem é do mercado:
            significa melhor leitura de tendência, cluster temático mais confiável e base mais sólida para
            planejamento editorial, parceria e distribuição.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mix de fontes: RSS x YouTube</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            <div className="h-[240px] w-full shrink-0">
              <NeoChartContainer config={sourceMixConfig} className="aspect-auto h-full w-full min-h-0">
                {({ defs, fillWarm, fillCool }) => (
                  <BarChart data={sourceMix}>
                    {defs}
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="tipo" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="fontes" fill={fillWarm} radius={[10, 10, 4, 4]} isAnimationActive />
                    <Bar dataKey="conteudos" fill={fillCool} radius={[10, 10, 4, 4]} isAnimationActive />
                  </BarChart>
                )}
              </NeoChartContainer>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
            Leitura rápida: RSS domina em volume bruto, YouTube tende a puxar contexto mais denso por conteúdo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participação no mês (share de conteúdos)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            <div className="h-[240px] w-full shrink-0">
              <ChartContainer config={sourceMixConfig} className="aspect-auto h-full w-full min-h-0">
                <PieChart>
                  <Pie data={sourceMix} dataKey="share" nameKey="tipo" innerRadius={58} outerRadius={98} paddingAngle={3} strokeWidth={0} isAnimationActive>
                    {sourceMix.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mesmo com menos fontes, YouTube pode concentrar blocos de assunto de maior recorrência no mês.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução mês a mês: volume x profundidade</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            <div className="h-[260px] w-full shrink-0">
              <ChartContainer config={monthlyEvolutionConfig} className="aspect-auto h-full w-full min-h-0">
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="conteudos"
                    stroke="#d4a574"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive
                    style={{ filter: "drop-shadow(0 0 6px rgba(212,165,116,0.55))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vinculos"
                    stroke="#00c853"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive
                    style={{ filter: "drop-shadow(0 0 6px rgba(0,200,83,0.45))" }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Quando a curva de vínculos cresce mais que a de conteúdos, a cobertura fica mais conectada e contextual.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clusters temáticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topEntityClusters.map((s, i) => (
              <div key={s.cluster} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{i + 1}. {s.cluster}</p>
                  <p className="text-xs text-muted-foreground">Frequência de coocorrência no mês</p>
                </div>
                <Badge>{s.citacoes}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qualidade de vínculos por tipo de conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-6">
          <div className="h-[280px] w-full shrink-0">
            <NeoChartContainer config={linkQualityConfig} className="aspect-auto h-full w-full min-h-0">
              {({ defs, fillWarm, fillCool, fillAmber }) => (
                <BarChart data={linkQualityByType}>
                  {defs}
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="tipo" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="assuntos" fill={fillWarm} radius={[10, 10, 4, 4]} isAnimationActive />
                  <Bar dataKey="tags" fill={fillCool} radius={[10, 10, 4, 4]} isAnimationActive />
                  <Bar dataKey="tipos" fill={fillAmber} radius={[10, 10, 4, 4]} isAnimationActive />
                </BarChart>
              )}
            </NeoChartContainer>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Explicação para vídeo: compare densidade por tipo para mostrar o equilíbrio entre volume e profundidade.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relevância: assuntos vs genérico (is_news)</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Conta todos os itens recebidos no período (RSS e YouTube), não só os publicados no site.
            <span className="text-foreground"> is_news = true</span> indica relevante para o hub;
            <span className="text-foreground"> false</span> indica genérico ou off-topic. Os filtros desta página
            recalculam estes números no preview.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          {!newsRelevance ? (
            <p className="text-sm text-muted-foreground">
              Gere novamente o relatório <strong className="text-foreground">Apresentação mensal</strong> para ver
              estatísticas de relevância por fonte.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[var(--radius)] border border-border p-3">
                  <p className="kpi-label">RSS (todos os itens)</p>
                  <p className="kpi-value mt-1">{newsRelevance.articles.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {newsRelevance.articles.subjects_context} relevantes · {newsRelevance.articles.generic} genéricos ·{" "}
                    {newsRelevance.articles.pct_subjects}% relevantes
                  </p>
                </div>
                <div className="rounded-[var(--radius)] border border-border p-3">
                  <p className="kpi-label">YouTube (todos os itens)</p>
                  <p className="kpi-value mt-1">{newsRelevance.videos.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {newsRelevance.videos.subjects_context} relevantes · {newsRelevance.videos.generic} genéricos ·{" "}
                    {newsRelevance.videos.pct_subjects}% relevantes
                  </p>
                </div>
                <div className="rounded-[var(--radius)] border border-border bg-muted/20 p-3">
                  <p className="kpi-label">Combinado</p>
                  <p className="kpi-value mt-1">{newsRelevance.combined.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {newsRelevance.combined.subjects_context} relevantes · {newsRelevance.combined.generic} genéricos ·{" "}
                    {newsRelevance.combined.pct_subjects}% relevantes
                  </p>
                </div>
              </div>
              <div className="h-[220px] w-full shrink-0">
                <NeoChartContainer config={newsRelevanceStackConfig} className="aspect-auto h-full w-full min-h-0">
                  {({ defs, fillWarm, fillAmber }) => (
                    <BarChart data={newsRelevanceBarData}>
                      {defs}
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                      <XAxis dataKey="canal" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="relevantes"
                        stackId="a"
                        fill={fillWarm}
                        radius={[0, 0, 0, 0]}
                        isAnimationActive
                      />
                      <Bar
                        dataKey="genericos"
                        stackId="a"
                        fill={fillAmber}
                        radius={[10, 10, 0, 0]}
                        isAnimationActive
                      />
                    </BarChart>
                  )}
                </NeoChartContainer>
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 font-medium">Fonte</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium text-right">Total</th>
                      <th className="px-3 py-2 font-medium text-right">Relevantes</th>
                      <th className="px-3 py-2 font-medium text-right">Genéricos</th>
                      <th className="px-3 py-2 font-medium text-right">% relevantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsRelevance.by_source.map((row) => (
                      <tr key={row.source_id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium">{row.source_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.provider === "youtube" ? "YouTube" : "RSS"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.total}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.subjects_context}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.generic}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.pct_subjects}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Até 50 fontes por volume no período; artigos sem vínculo em <code className="text-foreground">article_sources</code>{" "}
                aparecem na linha agregada “sem fonte vinculada”.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadência por dia da semana (RSS x YouTube)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-6">
          <div className="h-[260px] w-full shrink-0">
            <NeoChartContainer config={cadenceConfig} className="aspect-auto h-full w-full min-h-0">
              {({ defs, fillWarm, fillCool }) => (
                <BarChart data={cadenceByWeekday}>
                  {defs}
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="rss" fill={fillWarm} radius={[10, 10, 4, 4]} isAnimationActive />
                  <Bar dataKey="youtube" fill={fillCool} radius={[10, 10, 4, 4]} isAnimationActive />
                </BarChart>
              )}
            </NeoChartContainer>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Visão agregada do período: útil para ver em quais dias da semana o agregador recebe mais RSS e mais YouTube.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadência por dia da semana (por fonte)</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Até 15 fontes com mais conteúdos no período. Cada barra soma todas as publicações daquela fonte naquele dia da
            semana (Dom–Sáb) ao longo do <span className="text-foreground">período do relatório</span>, no fuso UTC —
            mesmo critério do gráfico “RSS x YouTube” acima.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          {!cadenceBySource.length ? (
            <p className="text-sm text-muted-foreground">
              Gere novamente o relatório <strong className="text-foreground">Apresentação mensal</strong> para ver a
              cadência por dia da semana por fonte.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2 sm:max-w-md sm:flex-1">
                  <Label htmlFor="cadence-source">Fonte</Label>
                  <Select
                    value={selectedCadenceSource?.source_id ?? ""}
                    onValueChange={(v) => setSelectedSourceId(v ?? null)}
                  >
                    <SelectTrigger id="cadence-source" className="h-9 w-full sm:w-full">
                      <SelectValue placeholder="Escolha uma fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      {cadenceBySource.map((s) => (
                        <SelectItem key={s.source_id} value={s.source_id}>
                          {s.source_name}{" "}
                          <span className="text-muted-foreground">
                            ({s.provider === "youtube" ? "YouTube" : "RSS"} · {s.total})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSourcePeak ? (
                  <Badge variant="outline" className="w-fit shrink-0">
                    Dia de pico: {selectedSourcePeak.label} ({selectedSourcePeak.valor} publicações)
                  </Badge>
                ) : null}
              </div>

              {selectedCadenceSource ? (
                <div className="h-[260px] w-full shrink-0">
                  <NeoChartContainer
                    config={sourceWeekdayChartConfig}
                    className="aspect-auto h-full w-full min-h-0"
                  >
                    {({ defs, fillWarm, fillCool }) => (
                      <BarChart data={selectedCadenceSource.dias}>
                        {defs}
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                        <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="conteudos"
                          fill={
                            selectedCadenceSource.provider === "youtube"
                              ? fillCool
                              : fillWarm
                          }
                          radius={[10, 10, 4, 4]}
                          isAnimationActive
                        />
                      </BarChart>
                    )}
                  </NeoChartContainer>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 font-medium">Fonte</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium text-right">Total</th>
                      <th className="px-3 py-2 font-medium">Dia de pico</th>
                      <th className="px-3 py-2 font-medium text-right">No pico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cadenceBySource.map((s) => {
                      const peak = peakDayLabel(s.dias);
                      return (
                        <tr
                          key={s.source_id}
                          className={`border-b border-border last:border-0 ${
                            s.source_id === selectedCadenceSource?.source_id ? "bg-muted/30" : ""
                          }`}
                        >
                          <td className="px-3 py-2 font-medium">{s.source_name}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {s.provider === "youtube" ? "YouTube" : "RSS"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{s.total}</td>
                          <td className="px-3 py-2 text-muted-foreground">{peak.label}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{peak.valor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Use a tabela para comparar o dia de pico entre fontes; o gráfico repete o formato “por dia da semana”, só
                que filtrado na fonte escolhida.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roteiro sugerido para vídeo (8 a 12 minutos)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          {(scripts.length ? scripts : [
            {
              title: "Abertura",
              text: "Gere o relatório month-presentation para preencher o roteiro automático.",
            },
          ]).map((item, idx) => (
            <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-4">
              <p className="font-semibold">{idx + 1}) {item.title}</p>
              <p className="text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

