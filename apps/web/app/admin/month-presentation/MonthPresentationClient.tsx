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
    jogos: number;
    tags: number;
    generos: number;
    plataformas: number;
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
  script: Array<{ title: string; text: string }>;
}

const pieColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
];

const sourceMixConfig = {
  fontes: { label: "Fontes", color: "hsl(var(--chart-1))" },
  conteudos: { label: "Conteúdos", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const monthlyEvolutionConfig = {
  conteudos: { label: "Conteúdos", color: "hsl(var(--chart-1))" },
  vinculos: { label: "Vínculos", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const linkQualityConfig = {
  jogos: { label: "Jogos", color: "hsl(var(--chart-1))" },
  tags: { label: "Tags", color: "hsl(var(--chart-2))" },
  generos: { label: "Gêneros", color: "hsl(var(--chart-3))" },
  plataformas: { label: "Plataformas", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const cadenceConfig = {
  rss: { label: "RSS", color: "hsl(var(--chart-1))" },
  youtube: { label: "YouTube", color: "hsl(var(--chart-2))" },
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
  const payload = (reportPayload as MonthPresentationPayload | null) ?? null;
  const sourceMix = payload?.source_mix ?? [];
  const monthlyEvolution = payload?.monthly_evolution ?? [];
  const linkQualityByType = payload?.link_quality ?? [];
  const topEntityClusters = payload?.top_clusters ?? [];
  const cadenceByWeekday = payload?.cadence ?? [];
  const cadenceBySourceRaw = payload?.cadence_by_source ?? [];
  const scripts = payload?.script ?? [];

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
        color: isYt ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))",
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
      note: "jogos, tags, gêneros e plataformas",
    },
    {
      label: "Densidade de contexto",
      value: String(summary.links_per_content),
      note: "média de vínculos por conteúdo",
    },
  ];

  return (
    <section className="space-y-6">
      <PageBackLink href="/admin">← Admin</PageBackLink>

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
        <div className="flex gap-2">
          <Badge variant={reportId ? "default" : "secondary"}>
            {reportId ? "Dados reais gerados" : "Sem relatório gerado"}
          </Badge>
          <Button size="sm">Exportar roteiro</Button>
        </div>
      </div>

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
            Em março, acompanhamos <strong className="text-foreground">132 fontes ativas</strong> e
            classificamos <strong className="text-foreground">5.940 conteúdos</strong>. O volume cresceu
            sobre fevereiro, mas o destaque real foi a profundidade: batemos
            <strong className="text-foreground"> 18.412 vínculos editoriais</strong>, com média de 3,1 vínculos por peça.
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
              <ChartContainer config={sourceMixConfig} className="aspect-auto h-full w-full min-h-0">
                <BarChart data={sourceMix}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="fontes" fill="var(--color-fontes)" radius={[6, 6, 0, 0]} isAnimationActive />
                  <Bar dataKey="conteudos" fill="var(--color-conteudos)" radius={[6, 6, 0, 0]} isAnimationActive />
                </BarChart>
              </ChartContainer>
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
                  <Pie data={sourceMix} dataKey="share" nameKey="tipo" outerRadius={95} isAnimationActive>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="conteudos"
                    stroke="var(--color-conteudos)"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="vinculos"
                    stroke="var(--color-vinculos)"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive
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
            <ChartContainer config={linkQualityConfig} className="aspect-auto h-full w-full min-h-0">
              <BarChart data={linkQualityByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="jogos" fill="var(--color-jogos)" isAnimationActive />
                <Bar dataKey="tags" fill="var(--color-tags)" isAnimationActive />
                <Bar dataKey="generos" fill="var(--color-generos)" isAnimationActive />
                <Bar dataKey="plataformas" fill="var(--color-plataformas)" isAnimationActive />
              </BarChart>
            </ChartContainer>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Explicação para vídeo: compare densidade por tipo para mostrar o equilíbrio entre volume e profundidade.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadência por dia da semana (RSS x YouTube)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-6">
          <div className="h-[260px] w-full shrink-0">
            <ChartContainer config={cadenceConfig} className="aspect-auto h-full w-full min-h-0">
              <BarChart data={cadenceByWeekday}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="rss" fill="var(--color-rss)" radius={[4, 4, 0, 0]} isAnimationActive />
                <Bar dataKey="youtube" fill="var(--color-youtube)" radius={[4, 4, 0, 0]} isAnimationActive />
              </BarChart>
            </ChartContainer>
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
                  <ChartContainer
                    config={sourceWeekdayChartConfig}
                    className="aspect-auto h-full w-full min-h-0"
                  >
                    <BarChart data={selectedCadenceSource.dias}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="conteudos"
                        fill="var(--color-conteudos)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive
                      />
                    </BarChart>
                  </ChartContainer>
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

