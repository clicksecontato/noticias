import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityWeekdayChart } from "../components/reports/ActivityWeekdayChart";
import { TagsChart } from "../components/reports/TagsChart";
import { TopGamesChart } from "../components/reports/TopGamesChart";
import { TopSourcesChart } from "../components/reports/TopSourcesChart";
import { VolumeChart } from "../components/reports/VolumeChart";

export function formatYMDAsPTBR(value: string): string {
  // value esperado: "YYYY-MM-DD" (ou ISO completo). Não usar `new Date(value)` porque
  // isso pode deslocar o dia por fuso horário.
  const ymd = value.includes("T") ? value.slice(0, 10) : value;
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function ReportPayload({
  type,
  payload,
}: {
  type: string;
  payload: Record<string, unknown>;
}) {
  if (type === "volume") {
    const rawSeries =
      (payload.series as Array<{
        date: string;
        articles: number;
        videos: number;
      }>) ?? [];
    const series = rawSeries.map((row) => ({
      ...row,
      total: row.articles + row.videos,
    }));
    const totals = (payload.totals as { articles: number; videos: number }) ?? {
      articles: 0,
      videos: 0,
    };
    const groupBy = (payload.group_by as string) ?? "day";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Totais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-muted-foreground">
            <strong className="text-foreground">{totals.articles}</strong> artigos
            · <strong className="text-foreground">{totals.videos}</strong> vídeos
          </p>
          <h3 className="text-lg font-semibold">
            Série (
            {groupBy === "day"
              ? "por dia"
              : groupBy === "week"
                ? "por semana"
                : "por mês"}
            )
          </h3>
          <VolumeChart data={series} groupBy={groupBy} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {series.map((row) => (
                  <tr key={row.date} className="border-b border-border">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right">
                      {row.articles + row.videos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "top_sources") {
    const items =
      (payload.items as Array<{
        source_id: string;
        source_name: string;
        articles: number;
        videos: number;
        total: number;
      }>) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de fontes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <TopSourcesChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Fonte</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.source_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.source_name}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "by_tags") {
    const items =
      (payload.items as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notícias por tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Quantidade de notícias (artigos) associadas a cada tag no período. Fontes não exibidas.
          </p>
          <TagsChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Tag</th>
                  <th className="p-3 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.tag_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.tag_name}</td>
                    <td className="p-3 text-right font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "by_source_detail") {
    const sourceId = (payload.source_id as string) ?? "";
    const sourceName = (payload.source_name as string) ?? sourceId;
    const tags =
      (payload.tags as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhe por fonte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Fonte: <span className="font-medium text-foreground">{sourceName}</span>
            {sourceId && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({sourceId})
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Distribuição de notícias (artigos) desta fonte por tag, no período selecionado.
          </p>
          <TagsChart data={tags} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Tag</th>
                  <th className="p-3 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((row, i) => (
                  <tr key={row.tag_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.tag_name}</td>
                    <td className="p-3 text-right font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "top_games") {
    const items =
      (payload.items as Array<{
        game_id: string;
        game_name: string;
        articles: number;
        videos: number;
        total: number;
      }>) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top jogos por período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Jogos com mais cobertura (artigos e vídeos) no período selecionado.
          </p>
          <TopGamesChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Jogo</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.game_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.game_name}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "activity_by_weekday") {
    const items =
      (payload.items as Array<{
        weekday: number;
        label: string;
        articles: number;
        videos: number;
        total: number;
      }>) ?? [];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade por dia da semana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Quantidade de notícias (artigos) e vídeos publicados em cada dia da semana.
          </p>
          <ActivityWeekdayChart data={items} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">Dia</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.weekday} className="border-b border-border">
                    <td className="p-3">{row.label}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "executive_summary") {
    type ExecutiveSummaryWindowPayload = {
      articles: number;
      videos: number;
      rss_vs_youtube: { rssPct: number; youtubePct: number };
      top_sources: Array<{ source_name: string; articles: number; videos: number; total: number }>;
      top_games: Array<{ game_name: string; articles: number; videos: number; total: number }>;
    };

    const referenceDate = (payload.reference_date as string) ?? "";
    const last7 = payload.last_7_days as ExecutiveSummaryWindowPayload;
    const last30 = payload.last_30_days as ExecutiveSummaryWindowPayload;
    const last90 = payload.last_90_days as ExecutiveSummaryWindowPayload;

    const WindowCard = ({
      title,
      data,
    }: {
      title: string;
      data: ExecutiveSummaryWindowPayload;
    }) => (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{data.articles}</strong> artigos ·{" "}
            <strong className="text-foreground">{data.videos}</strong> vídeos ·{" "}
            {data.rss_vs_youtube.rssPct}% RSS / {data.rss_vs_youtube.youtubePct}% YouTube
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Top fontes</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">Fonte</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.top_sources ?? []).slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-2">{row.source_name}</td>
                        <td className="p-2 text-right">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Top jogos</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">Jogo</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.top_games ?? []).slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-2">{row.game_name}</td>
                        <td className="p-2 text-right">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Visão consolidada em 7, 30 e 90 dias até a data de referência:{" "}
          <strong className="text-foreground">{new Date(referenceDate).toLocaleDateString("pt-BR")}</strong>
        </p>
        <WindowCard
          title="Últimos 7 dias"
          data={
            last7 ?? {
              articles: 0,
              videos: 0,
              rss_vs_youtube: { rssPct: 0, youtubePct: 0 },
              top_sources: [],
              top_games: [],
            }
          }
        />
        <WindowCard
          title="Últimos 30 dias"
          data={
            last30 ?? {
              articles: 0,
              videos: 0,
              rss_vs_youtube: { rssPct: 0, youtubePct: 0 },
              top_sources: [],
              top_games: [],
            }
          }
        />
        <WindowCard
          title="Últimos 90 dias"
          data={
            last90 ?? {
              articles: 0,
              videos: 0,
              rss_vs_youtube: { rssPct: 0, youtubePct: 0 },
              top_sources: [],
              top_games: [],
            }
          }
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

