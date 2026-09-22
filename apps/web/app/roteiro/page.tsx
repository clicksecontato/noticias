import { PageBackLink } from "../components/PageBackLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReportRepository } from "../../../../packages/database/src/report-repository";
import { generateTopSourcesReport } from "../../src/reports/generators/top-sources";

/**
 * Roteiro inicial do canal: apresentação + proposta.
 * Edite os blocos abaixo ou use docs/roteiro-inicial-canal.md como referência.
 */
const ROTEIRO = {
  nome: "[SEU NOME]",
  canal: "[NOME DO CANAL]",
  blocos: [
    {
      tempo: "0:00 – Abertura",
      titulo: "Abertura",
      texto: "Oi, eu sou [SEU NOME] e você está no [NOME DO CANAL].",
    },
    {
      tempo: "0:10 – O que é o canal",
      titulo: "O que é o canal",
      texto:
        "Este canal fala de notícias com foco no que está acontecendo no mercado brasileiro: coberturas, lançamentos, tendências e o que os principais portais e canais do Brasil estão publicando. A ideia é dar uma visão clara e organizada desse cenário — em texto e em vídeo — para quem quer acompanhar a conversa sem se perder no meio do caminho.",
    },
    {
      tempo: "0:25 – O que você vai encontrar aqui",
      titulo: "O que você vai encontrar aqui",
      texto:
        "Aqui você vai encontrar resumos periódicos do que moveu o mercado: volume de publicações, quem mais produziu conteúdo, quais assuntos dominaram a pauta e um resumo executivo dos últimos 7, 30 e 90 dias. Tudo com base em dados reais das fontes que cobrimos no Brasil, agregados em um só lugar.",
    },
    {
      tempo: "0:40 – Convite",
      titulo: "Convite",
      texto:
        "Se você curte notícias, trabalha com mídia, marketing ou só quer ficar por dentro do que está em alta, inscreva-se e ative o sininho para não perder os próximos vídeos. Nos vemos no próximo episódio.",
    },
  ],
};

function substituirPlaceholders(texto: string): string {
  return texto
    .replace(/\[SEU NOME\]/g, ROTEIRO.nome)
    .replace(/\[NOME DO CANAL\]/g, ROTEIRO.canal);
}

/** Retorna período dos últimos 7 dias em ISO (YYYY-MM-DD). */
function getUltimosSeteDias(): { periodStart: string; periodEnd: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

export interface DadosSemana {
  periodStart: string;
  periodEnd: string;
  articlesTotal: number;
  videosTotal: number;
  total: number;
  topSources: Array<{ source_name: string; total: number }>;
  topSubjects: Array<{ subject_name: string; total: number }>;
  topTags: Array<{ tag_name: string; count: number }>;
}

async function getDadosSemana(): Promise<DadosSemana | null> {
  try {
    const repo = createReportRepository();
    const { periodStart, periodEnd } = getUltimosSeteDias();

    const [articles, videos, sourceNames, subjectCounts, tagCounts] = await Promise.all([
      repo.getArticlesForReports(periodStart, periodEnd),
      repo.getVideosForReports(periodStart, periodEnd),
      repo.getSourceIdToName(),
      repo.getSubjectCountsForReports(periodStart, periodEnd),
      repo.getTagCountsForReports(periodStart, periodEnd),
    ]);

    const topSourcesPayload = generateTopSourcesReport(
      articles,
      videos,
      sourceNames,
      { limit: 5 }
    );

    return {
      periodStart,
      periodEnd,
      articlesTotal: articles.length,
      videosTotal: videos.length,
      total: articles.length + videos.length,
      topSources: topSourcesPayload.items.map((s) => ({ source_name: s.source_name, total: s.total })),
      topSubjects: (subjectCounts ?? []).slice(0, 5).map((g) => ({ subject_name: g.subject_name, total: g.total })),
      topTags: (tagCounts ?? []).slice(0, 5).map((t) => ({ tag_name: t.tag_name, count: t.count })),
    };
  } catch {
    return null;
  }
}

/** Monta os blocos do roteiro da semana a partir dos dados. */
function montarBlocosRoteiroSemana(dados: DadosSemana) {
  const listaFontes =
    dados.topSources.length > 0
      ? dados.topSources.map((s) => s.source_name).join(", ")
      : "—";
  const listaAssuntos =
    dados.topSubjects.length > 0
      ? dados.topSubjects.map((g) => g.subject_name).join(", ")
      : "—";
  const listaTags =
    dados.topTags.length > 0
      ? dados.topTags.map((t) => t.tag_name).join(", ")
      : "—";

  return [
    {
      tempo: "Números da semana",
      titulo: "Volume",
      texto: `Na última semana (de ${formatarData(dados.periodStart)} a ${formatarData(dados.periodEnd)}) foram publicados ${dados.articlesTotal} artigos e ${dados.videosTotal} vídeos nas fontes brasileiras que acompanhamos — um total de ${dados.total} publicações.`,
    },
    {
      tempo: "Quem mais publicou",
      titulo: "Top fontes",
      texto: `As fontes que mais produziram conteúdo no período foram: ${listaFontes}.`,
    },
    {
      tempo: "Assuntos em destaque",
      titulo: "Top assuntos na pauta",
      texto: `Os assuntos que mais apareceram na cobertura foram: ${listaAssuntos}.`,
    },
    {
      tempo: "Temas em alta",
      titulo: "Tags em destaque",
      texto: `Entre os temas que mais apareceram nas notícias estão: ${listaTags}.`,
    },
  ];
}

function formatarData(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export const metadata = {
  title: "Roteiro inicial",
  description:
    "Roteiro de apresentação do canal e roteiro da semana com dados do banco: uso em vídeos ou teleprompter.",
};

export default async function RoteiroPage() {
  const dadosSemana = await getDadosSemana();

  return (
    <section className="space-y-8">
      <PageBackLink href="/">← Início</PageBackLink>
      <h1 className="text-2xl font-semibold">Roteiros</h1>
      <p className="text-muted-foreground">
        Roteiro de apresentação do canal e roteiro da semana com dados atualizados do banco. Use na
        abertura dos vídeos ou como base para o resumo semanal.
      </p>

      {/* Roteiro inicial (apresentação + proposta) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Roteiro inicial (apresentação + proposta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {ROTEIRO.blocos.map((bloco, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{bloco.tempo}</p>
              <h2 className="text-base font-semibold">{bloco.titulo}</h2>
              <p className="whitespace-pre-line text-[1.05rem] leading-relaxed">
                {substituirPlaceholders(bloco.texto)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Roteiro da semana (dados do banco) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Roteiro da semana (dados do banco)</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Sequência com números e destaques dos últimos 7 dias. Atualizado com base nas publicações
            das fontes cadastradas.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {dadosSemana ? (
            <>
              <p className="text-xs text-muted-foreground">
                Período: {formatarData(dadosSemana.periodStart)} a{" "}
                {formatarData(dadosSemana.periodEnd)}
              </p>
              {montarBlocosRoteiroSemana(dadosSemana).map((bloco, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{bloco.tempo}</p>
                  <h2 className="text-base font-semibold">{bloco.titulo}</h2>
                  <p className="whitespace-pre-line text-[1.05rem] leading-relaxed">
                    {bloco.texto}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-muted-foreground">
              Não foi possível carregar os dados da semana. Verifique a conexão com o banco e se
              há fontes e publicações no período.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Roteiro inicial:</strong> Use na primeira vez ou
            na abertura fixa dos episódios. Edite a constante ROTEIRO em app/roteiro/page.tsx para
            [SEU NOME] e [NOME DO CANAL]. Documento completo em docs/roteiro-inicial-canal.md.
          </p>
          <p>
            <strong className="text-foreground">Roteiro da semana:</strong> Gerado com dados reais
            dos últimos 7 dias. Use para o vídeo de resumo semanal; os números e listas vêm do
            banco e são atualizados a cada carregamento da página.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
