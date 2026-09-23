import Link from "next/link";
import { createHubPipelineRepository } from "../../../../packages/database/src/hub-pipeline-repository";
import type { HubPipelineStats } from "../../../../packages/database/src/hub-pipeline-stats";
import { PIPELINE_STEP_TITLES } from "../../src/sistema/pipeline-copy";
import { PageBackLink } from "../components/PageBackLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIngestionDurationMs } from "@/src/ui/format-ingestion-duration";

export const revalidate = 900;

export const metadata = {
  title: "Como o sistema funciona",
  description:
    "Transparência do hub: ingestão de fontes, filtro editorial, enriquecimento e organização da pauta de IA.",
};

const PIPELINE_BODIES = [
  "RSS e canais YouTube ativos alimentam o hub de forma contínua.",
  "Cada fonte é coletada; medimos quando rodou e quanto tempo levou.",
  "O flag is_news separa o que é pauta relevante do que é genérico ou off-topic.",
  "Assuntos, tags e tipos ligam cada peça ao catálogo temático.",
  "O leitor consome notícias e relatórios; esta página mostra a máquina por trás.",
] as const;

const PIPELINE_STEPS = PIPELINE_STEP_TITLES.map((title, index) => ({
  step: String(index + 1),
  title,
  body: PIPELINE_BODIES[index],
}));

function formatPct(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Ainda não registrada";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function loadStats(): Promise<HubPipelineStats | null> {
  try {
    const repo = createHubPipelineRepository();
    return await repo.getHubPipelineStats();
  } catch {
    return null;
  }
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function CoverageBar({ label, pct }: { label: string; pct: number }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatPct(pct)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default async function SistemaPage() {
  const stats = await loadStats();

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <PageBackLink href="/">Início</PageBackLink>
        <h1 className="text-3xl font-semibold tracking-tight">
          A máquina que organiza a pauta
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Este portal tem dois lados: o consumo da pauta de inteligência artificial
          e a transparência do sistema que a monta — fontes, ingestão, filtro
          editorial e vínculos temáticos. Os números abaixo vêm do banco em
          produção (atualizados a cada ~15 minutos).
        </p>
        <p className="text-sm text-muted-foreground">
          Quer só a pauta? Veja{" "}
          <Link href="/news" className="text-primary underline-offset-2 hover:underline">
            notícias
          </Link>
          ,{" "}
          <Link href="/videos" className="text-primary underline-offset-2 hover:underline">
            vídeos
          </Link>{" "}
          e o{" "}
          <Link href="/roteiro" className="text-primary underline-offset-2 hover:underline">
            roteiro da semana
          </Link>
          .
        </p>
      </div>

      <Card className="surface-brand overflow-hidden">
        <CardHeader>
          <CardTitle>Como o fluxo funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PIPELINE_STEPS.map((item) => (
              <li key={item.step} className="relative space-y-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </span>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {!stats ? (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            Não foi possível carregar as métricas agora. Tente de novo em instantes.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Kpi
                  label="Fontes ativas"
                  value={String(stats.sources.active_total)}
                  hint={`${stats.sources.active_rss} RSS · ${stats.sources.active_youtube} YouTube`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Kpi
                  label="Última ingestão"
                  value={formatDateTime(stats.sources.last_ingested_at)}
                  hint={`Média ${formatIngestionDurationMs(stats.sources.avg_ingestion_duration_ms)}`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Kpi
                  label="Volume (7 dias)"
                  value={String(stats.recent_7d.total)}
                  hint={`${stats.recent_7d.articles} artigos · ${stats.recent_7d.videos} vídeos`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Kpi
                  label="Fontes quietas"
                  value={String(stats.sources.quiet_sources)}
                  hint="Ativas sem coleta nos últimos 7 dias"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Filtro editorial (is_news)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Nem tudo que chega vira pauta. O hub marca o que é notícia
                  relevante para o leitor.
                </p>
                <CoverageBar
                  label={`Artigos relevantes (${stats.content.articles_news}/${stats.content.articles_total})`}
                  pct={stats.content.articles_news_pct}
                />
                <CoverageBar
                  label={`Vídeos relevantes (${stats.content.videos_news}/${stats.content.videos_total})`}
                  pct={stats.content.videos_news_pct}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cobertura de enriquecimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Entre os itens relevantes, quanto já tem assunto ou tag
                  vinculados.
                </p>
                <CoverageBar
                  label="Artigos com assunto"
                  pct={stats.enrichment.articles_with_subject_pct}
                />
                <CoverageBar
                  label="Artigos com tag"
                  pct={stats.enrichment.articles_with_tag_pct}
                />
                <CoverageBar
                  label="Vídeos com assunto"
                  pct={stats.enrichment.videos_with_subject_pct}
                />
                <CoverageBar
                  label="Vídeos com tag"
                  pct={stats.enrichment.videos_with_tag_pct}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Catálogo temático</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <Kpi label="Assuntos" value={String(stats.catalog.subjects)} />
                <Kpi label="Tags" value={String(stats.catalog.tags)} />
                <Kpi label="Tipos" value={String(stats.catalog.types)} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Snapshot gerado em{" "}
                {new Date(stats.generated_at).toLocaleString("pt-BR")}.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
