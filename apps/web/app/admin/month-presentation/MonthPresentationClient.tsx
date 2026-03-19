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

const headlineKpis = [
  {
    label: "Fontes ativas analisadas",
    value: "132",
    note: "84 RSS e 48 YouTube no mês (mock)",
  },
  {
    label: "Conteúdos classificados",
    value: "5.940",
    note: "3.780 artigos + 2.160 vídeos (mock)",
  },
  {
    label: "Vínculos gerados",
    value: "18.412",
    note: "jogos, tags, gêneros e plataformas (mock)",
  },
  {
    label: "Densidade de contexto",
    value: "3,1",
    note: "média de vínculos por conteúdo (mock)",
  },
];

const sourceMix = [
  { tipo: "RSS", fontes: 84, conteudos: 3780, share: 64 },
  { tipo: "YouTube", fontes: 48, conteudos: 2160, share: 36 },
];

const monthlyEvolution = [
  { mes: "Jan", conteudos: 5220, vinculos: 14980 },
  { mes: "Fev", conteudos: 5510, vinculos: 16440 },
  { mes: "Mar", conteudos: 5940, vinculos: 18412 },
];

const linkQualityByType = [
  { tipo: "Notícia RSS", jogos: 1.4, tags: 2.2, generos: 0.9, plataformas: 0.8 },
  { tipo: "Vídeo YouTube", jogos: 1.9, tags: 2.8, generos: 1.2, plataformas: 0.7 },
];

const topEntityClusters = [
  { cluster: "GTA VI + mundo aberto", citacoes: 1240 },
  { cluster: "Game Pass + lançamentos", citacoes: 1095 },
  { cluster: "PS5 Pro + desempenho", citacoes: 980 },
  { cluster: "CS2 + competitivo", citacoes: 910 },
  { cluster: "Nintendo Switch 2", citacoes: 875 },
];

const cadenceByWeekday = [
  { dia: "Seg", rss: 540, youtube: 280 },
  { dia: "Ter", rss: 630, youtube: 350 },
  { dia: "Qua", rss: 680, youtube: 390 },
  { dia: "Qui", rss: 710, youtube: 410 },
  { dia: "Sex", rss: 690, youtube: 430 },
  { dia: "Sáb", rss: 320, youtube: 210 },
  { dia: "Dom", rss: 210, youtube: 90 },
];

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

export function MonthPresentationClient() {
  return (
    <section className="space-y-6">
      <PageBackLink href="/admin">← Admin</PageBackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roteiro Visual do Mês (Fontes e Vínculos)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leitura editorial do mês com dados mockados: quem publicou, como os conteúdos se conectam
            e quais histórias explicam o período para público leigo e também para quem é do ramo.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Dados mockados</Badge>
          <Button size="sm">Exportar roteiro</Button>
        </div>
      </div>

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
              Leitura rápida: RSS domina em volume bruto, YouTube puxa contexto mais denso por conteúdo.
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
              Mesmo com menos fontes, YouTube representa 36% do volume e concentra blocos de assunto de maior recorrência.
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
              Conteúdo subiu ~7,8% de fev para mar, enquanto vínculos subiram ~11,9%: o mês não só teve mais peças, teve
              mais contexto por peça.
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
            Explicação para vídeo: vídeos costumam trazer mais jogo/tag por peça, enquanto RSS tende a dar maior cobertura ampla.
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
            Ponto prático para o vídeo: terça a sexta concentra o pico de pauta; fim de semana cai volume e aumenta peso de tema recorrente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roteiro sugerido para vídeo (8 a 12 minutos)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div className="rounded-lg border border-border p-4">
            <p className="font-semibold">1) Abertura (0:00 - 1:00)</p>
            <p className="text-muted-foreground">
              "Neste mês analisamos 132 fontes e quase 6 mil conteúdos. O diferencial não foi só volume:
              foram 18 mil vínculos entre jogos, tags, gêneros e plataformas."
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-semibold">2) De onde vieram os dados (1:00 - 3:00)</p>
            <p className="text-muted-foreground">
              Mostre o mix RSS x YouTube e explique de forma simples: RSS trouxe escala de cobertura e YouTube
              trouxe contexto forte por conteúdo.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-semibold">3) O que o mês contou pra gente (3:00 - 7:00)</p>
            <p className="text-muted-foreground">
              Foque em evolução mensal + clusters temáticos: quais assuntos dominaram e como eles se conectaram
              entre plataformas e formatos.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-semibold">4) Fechamento para leigo e especialista (7:00 - 10:00)</p>
            <p className="text-muted-foreground">
              Leigo: "o que foi mais falado e por quê". Especialista: "o que isso indica para pauta, produção e timing
              do próximo mês". Finalize com 2 hipóteses para o próximo ciclo.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

