"use client";

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
  const scripts = payload?.script ?? [];

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
          <CardTitle>Cadência semanal de publicação (ritmo editorial)</CardTitle>
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
            Ponto prático para o vídeo: identifique os dias com pico de pauta para organizar calendário editorial.
          </p>
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

