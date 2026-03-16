import Link from "next/link";
import { PageBackLink } from "../components/PageBackLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        "Este canal fala de games com foco no que está acontecendo no mercado brasileiro: notícias, lançamentos, tendências e o que os principais portais e canais do Brasil estão publicando sobre jogos. A ideia é dar uma visão clara e organizada desse cenário — em texto e em vídeo — para quem quer acompanhar a conversa sem se perder no meio do caminho.",
    },
    {
      tempo: "0:25 – O que você vai encontrar aqui",
      titulo: "O que você vai encontrar aqui",
      texto:
        "Aqui você vai encontrar resumos periódicos do que moveu o mercado: volume de publicações, quem mais produziu conteúdo, quais jogos dominaram a pauta e um resumo executivo dos últimos 7, 30 e 90 dias. Tudo com base em dados reais das fontes que cobrem games no Brasil, agregados em um só lugar.",
    },
    {
      tempo: "0:40 – Convite",
      titulo: "Convite",
      texto:
        "Se você curte games, trabalha com mídia, marketing ou só quer ficar por dentro do que está em alta, inscreva-se e ative o sininho para não perder os próximos vídeos. Nos vemos no próximo episódio.",
    },
  ],
};

function substituirPlaceholders(texto: string): string {
  return texto
    .replace(/\[SEU NOME\]/g, ROTEIRO.nome)
    .replace(/\[NOME DO CANAL\]/g, ROTEIRO.canal);
}

export const metadata = {
  title: "Roteiro inicial",
  description:
    "Roteiro de apresentação do canal e do que se trata: uso em vídeos de abertura ou teleprompter.",
};

export default function RoteiroPage() {
  return (
    <section className="space-y-6">
      <PageBackLink href="/">← Início</PageBackLink>
      <h1 className="text-2xl font-semibold">Roteiro inicial do canal</h1>
      <p className="text-muted-foreground">
        Use este texto na abertura dos vídeos para se apresentar e explicar do que se trata o canal.
        Edite a constante <code className="rounded bg-muted px-1 text-sm">ROTEIRO</code> em{" "}
        <code className="rounded bg-muted px-1 text-sm">app/roteiro/page.tsx</code> para personalizar
        (nome e canal). O documento completo está em{" "}
        <code className="rounded bg-muted px-1 text-sm">docs/roteiro-inicial-canal.md</code>.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roteiro (apresentação + proposta)</CardTitle>
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

      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Duração sugerida:</strong> 45–60 segundos na
            versão curta; você pode estender cada bloco com exemplos ou um resumo da semana.
          </p>
          <p>
            <strong className="text-foreground">Onde usar:</strong> Primeiro vídeo do canal ou
            abertura fixa dos episódios de resumo (ex.: “Resumo da semana em games”).
          </p>
          <p>
            <strong className="text-foreground">Personalize:</strong> Troque [SEU NOME] e [NOME DO
            CANAL] no código; se quiser, acrescente uma frase sobre sua trajetória ou por que criou
            o canal.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
