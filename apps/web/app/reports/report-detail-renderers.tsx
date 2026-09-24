import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityWeekdayChart } from "../components/reports/ActivityWeekdayChart";
import { TagsChart } from "../components/reports/TagsChart";
import { TopSubjectsChart } from "../components/reports/TopSubjectsChart";
import { RadarPautaChart } from "../components/reports/RadarPautaChart";
import { MapaTematicoChart } from "../components/reports/MapaTematicoChart";
import { TopSourcesChart } from "../components/reports/TopSourcesChart";
import { VolumeChart } from "../components/reports/VolumeChart";
import { ReportCollapsibleTable } from "../components/reports/ReportCollapsibleTable";
import {
  ReportInsight,
  ReportKpiStrip,
  ReportSection,
  ReportTrendBadge,
} from "../components/reports/ReportShell";
import {
  buildExecutiveInsights,
  buildMapaInsights,
  buildRadarInsights,
  buildRankingInsights,
  buildSourceDetailInsights,
  buildVolumeInsights,
  buildWeekdayInsights,
} from "../../src/reports/report-view-insights";
import { MonthPresentationClient } from "../admin/month-presentation/MonthPresentationClient";
import { SourceAvatar } from "../components/SourceAvatar";
import { cn } from "@/lib/utils";

export function formatYMDAsPTBR(value: string): string {
  const ymd = value.includes("T") ? value.slice(0, 10) : value;
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function avatarFor(
  sourceAvatars: Record<string, string | null> | undefined,
  sourceId: string | undefined | null
): string | null {
  if (!sourceAvatars || !sourceId) return null;
  return sourceAvatars[sourceId] ?? null;
}

function MixBar({
  rssPct,
  youtubePct,
}: {
  rssPct: number;
  youtubePct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-[color-mix(in_srgb,var(--primary)_75%,transparent)]"
          style={{ width: `${Math.max(0, Math.min(100, rssPct))}%` }}
        />
        <div
          className="bg-[color-mix(in_srgb,var(--chart-2)_80%,transparent)]"
          style={{ width: `${Math.max(0, Math.min(100, youtubePct))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {rssPct}% RSS · {youtubePct}% YouTube
      </p>
    </div>
  );
}

function RankList({
  items,
  nameKey,
  idKey,
  sourceAvatars,
}: {
  items: Array<{ total: number } & Record<string, unknown>>;
  nameKey: string;
  idKey?: string;
  sourceAvatars?: Record<string, string | null>;
}) {
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <ul className="space-y-2">
      {items.map((row, i) => {
        const name = String(row[nameKey] ?? "");
        const id = idKey ? String(row[idKey] ?? "") : "";
        const imageUrl = avatarFor(sourceAvatars, id);
        return (
          <li key={`${name}-${i}`} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-foreground">
                <span className="shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                {idKey ? (
                  <SourceAvatar name={name} imageUrl={imageUrl} size="xs" />
                ) : null}
                <span className="truncate">{name}</span>
              </span>
              <span className="shrink-0 tabular-nums font-medium">{row.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[color-mix(in_srgb,var(--primary)_70%,transparent)]"
                style={{ width: `${Math.round((row.total / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Podium({
  items,
}: {
  items: Array<{ name: string; total: number; note?: string; imageUrl?: string | null }>;
}) {
  const top = items.slice(0, 3);
  if (!top.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {top.map((item, idx) => (
        <div
          key={item.name}
          className={cn(
            "rounded-xl border border-border/70 p-3",
            idx === 0 &&
              "bg-[linear-gradient(145deg,rgba(232,196,154,0.18),transparent)] shadow-[inset_0_0_0_1px_rgba(232,196,154,0.25)]"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            #{idx + 1}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {"imageUrl" in item ? (
              <SourceAvatar name={item.name} imageUrl={item.imageUrl} size="sm" />
            ) : null}
            <p className="truncate font-semibold text-foreground" title={item.name}>
              {item.name}
            </p>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{item.total}</p>
          {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function ReportPayload({
  type,
  payload,
  reportId,
  periodStart,
  periodEnd,
  sourceAvatars,
}: {
  type: string;
  payload: Record<string, unknown>;
  reportId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  sourceAvatars?: Record<string, string | null>;
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
    const { kpis, insight } = buildVolumeInsights(rawSeries, totals);
    const articlesShare =
      totals.articles + totals.videos > 0
        ? Math.round((totals.articles / (totals.articles + totals.videos)) * 100)
        : 0;
    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <ReportSection
          title={`Série (${groupBy === "day" ? "por dia" : groupBy === "week" ? "por semana" : "por mês"})`}
          description="Evolução de artigos e vídeos no período."
        >
          <MixBar rssPct={articlesShare} youtubePct={100 - articlesShare} />
          <VolumeChart data={series} groupBy={groupBy} />
          <ReportCollapsibleTable title="Série completa" rowCount={series.length}>
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
                    <td className="p-3 text-right font-medium">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
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
    const { kpis, insight } = buildRankingInsights(
      items.map((i) => ({ name: i.source_name, total: i.total })),
      "fonte"
    );
    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <Podium
          items={items.map((i) => ({
            name: i.source_name,
            total: i.total,
            note: `${i.articles} art. · ${i.videos} vid.`,
            imageUrl: avatarFor(sourceAvatars, i.source_id),
          }))}
        />
        <ReportSection title="Distribuição" description="Ranking completo de fontes no período.">
          <TopSourcesChart data={items} />
          <ReportCollapsibleTable title="Ranking completo" rowCount={items.length}>
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
                    <td className="p-3">
                      <span className="inline-flex items-center gap-2">
                        <SourceAvatar
                          name={row.source_name}
                          imageUrl={avatarFor(sourceAvatars, row.source_id)}
                          size="xs"
                        />
                        {row.source_name}
                      </span>
                    </td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "by_tags") {
    const items =
      (payload.items as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    const { kpis, insight } = buildRankingInsights(
      items.map((i) => ({ name: i.tag_name, total: i.count })),
      "tag"
    );
    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <Podium items={items.map((i) => ({ name: i.tag_name, total: i.count }))} />
        <ReportSection
          title="Notícias por tag"
          description="Quantidade de artigos associados a cada tag no período."
        >
          <TagsChart data={items} />
          <ReportCollapsibleTable title="Tags" rowCount={items.length}>
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
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "by_source_detail") {
    const sourceId = (payload.source_id as string) ?? "";
    const sourceName = (payload.source_name as string) ?? sourceId;
    const articlesTotal = Number(payload.articles_total ?? 0);
    const videosTotal = Number(payload.videos_total ?? 0);
    const tags =
      (payload.tags as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    const { kpis, insight } = buildSourceDetailInsights({
      articles_total: articlesTotal,
      videos_total: videosTotal,
      tags,
    });
    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>
          <span className="inline-flex items-center gap-2">
            <SourceAvatar
              name={sourceName}
              imageUrl={avatarFor(sourceAvatars, sourceId)}
              size="sm"
            />
            <strong className="text-foreground">{sourceName}</strong>
          </span>{" "}
          — {insight}
        </ReportInsight>
        <ReportSection
          title="Tags da fonte"
          description="Distribuição de artigos desta fonte por tag no período."
        >
          <TagsChart data={tags} />
          <ReportCollapsibleTable title="Tags da fonte" rowCount={tags.length}>
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
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "top_subjects") {
    const items =
      (payload.items as Array<{
        subject_id: string;
        subject_name: string;
        articles: number;
        videos: number;
        total: number;
      }>) ?? [];
    const { kpis, insight } = buildRankingInsights(
      items.map((i) => ({ name: i.subject_name, total: i.total })),
      "assunto"
    );
    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <Podium
          items={items.map((i) => ({
            name: i.subject_name,
            total: i.total,
            note: `${i.articles} art. · ${i.videos} vid.`,
          }))}
        />
        <ReportSection
          title="Top assuntos"
          description="Assuntos com mais cobertura (artigos e vídeos) no período."
        >
          <TopSubjectsChart data={items} />
          <ReportCollapsibleTable title="Assuntos" rowCount={items.length}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Assunto</th>
                  <th className="p-3 text-right">Artigos</th>
                  <th className="p-3 text-right">Vídeos</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={row.subject_id} className="border-b border-border">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{row.subject_name}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "radar_pauta") {
    const items =
      (payload.items as Array<{
        subject_id: string;
        subject_name: string;
        articles: number;
        videos: number;
        total: number;
        previous_total: number;
        delta: number;
        delta_pct: number | null;
        trend: "up" | "down" | "new" | "stable";
        rank: number;
        previous_rank: number | null;
      }>) ?? [];
    const previousPeriod = payload.previous_period as
      | { start: string; end: string }
      | undefined;
    const { kpis, topUp, topDown, insight } = buildRadarInsights(items);

    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-300">Maiores altas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alta no período.</p>
              ) : (
                topUp.map((row) => (
                  <div
                    key={row.subject_name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-emerald-500/5 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium">{row.subject_name}</span>
                    <span className="shrink-0 tabular-nums text-sm font-semibold text-emerald-300">
                      +{row.delta}
                      {row.delta_pct != null ? ` (${row.delta_pct > 0 ? "+" : ""}${row.delta_pct}%)` : ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="border-rose-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-rose-300">Maiores quedas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma queda no período.</p>
              ) : (
                topDown.map((row) => (
                  <div
                    key={row.subject_name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-rose-500/5 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium">{row.subject_name}</span>
                    <span className="shrink-0 tabular-nums text-sm font-semibold text-rose-300">
                      {row.delta}
                      {row.delta_pct != null ? ` (${row.delta_pct}%)` : ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <ReportSection
          title="Movimento da pauta"
          description={
            previousPeriod
              ? `Comparado com ${formatYMDAsPTBR(previousPeriod.start)} a ${formatYMDAsPTBR(previousPeriod.end)}.`
              : "Comparado com a janela anterior de mesma duração."
          }
        >
          <RadarPautaChart data={items} />
          <ReportCollapsibleTable title="Movimento completo" rowCount={items.length}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Assunto</th>
                  <th className="p-3 text-right">Atual</th>
                  <th className="p-3 text-right">Anterior</th>
                  <th className="p-3 text-right">Δ</th>
                  <th className="p-3 text-right">Δ%</th>
                  <th className="p-3 text-left">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.subject_id} className="border-b border-border">
                    <td className="p-3 tabular-nums">
                      {row.rank}
                      {row.previous_rank != null && row.previous_rank !== row.rank ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {row.rank < row.previous_rank ? "↑" : "↓"}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">{row.subject_name}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                    <td className="p-3 text-right">{row.previous_total}</td>
                    <td className="p-3 text-right tabular-nums">
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {row.delta_pct == null
                        ? "—"
                        : `${row.delta_pct > 0 ? "+" : ""}${row.delta_pct}%`}
                    </td>
                    <td className="p-3">
                      <ReportTrendBadge trend={row.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "mapa_tematico") {
    const clusters =
      (payload.clusters as Array<{
        cluster_id: string;
        cluster_label: string;
        articles: number;
        videos: number;
        total: number;
        share_pct: number;
        subjects: Array<{
          subject_id: string;
          subject_name: string;
          subject_slug: string;
          articles: number;
          videos: number;
          total: number;
        }>;
      }>) ?? [];
    const totals = (payload.totals as {
      articles: number;
      videos: number;
      total: number;
    }) ?? { articles: 0, videos: 0, total: 0 };
    const { kpis, insight } = buildMapaInsights(clusters, totals);

    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ReportSection title="Share por cluster">
            <MapaTematicoChart data={clusters} />
          </ReportSection>
          <ReportSection title="Concentração">
            <ul className="space-y-3">
              {clusters.map((c) => (
                <li key={c.cluster_id} className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium">{c.cluster_label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.share_pct}% · {c.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[color-mix(in_srgb,var(--primary)_70%,transparent)]"
                      style={{ width: `${Math.min(100, c.share_pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ReportSection>
        </div>
        <div className="space-y-4">
          {clusters.map((cluster) => (
            <ReportSection
              key={cluster.cluster_id}
              title={cluster.cluster_label}
              description={`${cluster.total} menções (${cluster.share_pct}%) · ${cluster.articles} art. · ${cluster.videos} vídeos`}
            >
              {cluster.subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem assuntos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cluster.subjects.map((s) => (
                    <span
                      key={s.subject_id}
                      className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5 text-sm"
                    >
                      <span>{s.subject_name}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">{s.total}</span>
                    </span>
                  ))}
                </div>
              )}
            </ReportSection>
          ))}
        </div>
      </div>
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
    const { kpis, insight, peakLabel } = buildWeekdayInsights(items);

    return (
      <div className="space-y-5">
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <ReportSection
          title="Cadência semanal"
          description="Volume de artigos e vídeos por dia da semana."
        >
          <ActivityWeekdayChart data={items} />
          <ReportCollapsibleTable title="Por dia da semana" rowCount={items.length} defaultOpen>
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
                  <tr
                    key={row.weekday}
                    className={cn(
                      "border-b border-border",
                      peakLabel === row.label && "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
                    )}
                  >
                    <td className="p-3 font-medium">{row.label}</td>
                    <td className="p-3 text-right">{row.articles}</td>
                    <td className="p-3 text-right">{row.videos}</td>
                    <td className="p-3 text-right font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCollapsibleTable>
        </ReportSection>
      </div>
    );
  }

  if (type === "executive_summary") {
    type ExecutiveSummaryWindowPayload = {
      articles: number;
      videos: number;
      rss_vs_youtube: { rssPct: number; youtubePct: number };
      top_sources: Array<{
        source_id: string;
        source_name: string;
        articles: number;
        videos: number;
        total: number;
      }>;
      top_subjects: Array<{ subject_name: string; articles: number; videos: number; total: number }>;
    };

    const referenceDate = (payload.reference_date as string) ?? "";
    const emptyWindow: ExecutiveSummaryWindowPayload = {
      articles: 0,
      videos: 0,
      rss_vs_youtube: { rssPct: 0, youtubePct: 0 },
      top_sources: [],
      top_subjects: [],
    };
    const last7 = (payload.last_7_days as ExecutiveSummaryWindowPayload) ?? emptyWindow;
    const last30 = (payload.last_30_days as ExecutiveSummaryWindowPayload) ?? emptyWindow;
    const last90 = (payload.last_90_days as ExecutiveSummaryWindowPayload) ?? emptyWindow;

    const { kpis, insight } = buildExecutiveInsights({
      last7: {
        articles: last7.articles,
        videos: last7.videos,
        rssPct: last7.rss_vs_youtube.rssPct,
        youtubePct: last7.rss_vs_youtube.youtubePct,
      },
      last30: {
        articles: last30.articles,
        videos: last30.videos,
        rssPct: last30.rss_vs_youtube.rssPct,
        youtubePct: last30.rss_vs_youtube.youtubePct,
      },
      last90: {
        articles: last90.articles,
        videos: last90.videos,
        rssPct: last90.rss_vs_youtube.rssPct,
        youtubePct: last90.rss_vs_youtube.youtubePct,
      },
    });

    const windows: Array<{ title: string; data: ExecutiveSummaryWindowPayload }> = [
      { title: "Últimos 7 dias", data: last7 },
      { title: "Últimos 30 dias", data: last30 },
      { title: "Últimos 90 dias", data: last90 },
    ];

    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Visão consolidada até{" "}
          <strong className="text-foreground">
            {referenceDate
              ? formatYMDAsPTBR(referenceDate)
              : "—"}
          </strong>
        </p>
        <ReportKpiStrip items={kpis} />
        <ReportInsight>{insight}</ReportInsight>
        <div className="grid gap-4 lg:grid-cols-3">
          {windows.map(({ title, data }) => (
            <Card key={title} className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Artigos</p>
                    <p className="text-xl font-semibold tabular-nums">{data.articles}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vídeos</p>
                    <p className="text-xl font-semibold tabular-nums">{data.videos}</p>
                  </div>
                </div>
                <MixBar
                  rssPct={data.rss_vs_youtube.rssPct}
                  youtubePct={data.rss_vs_youtube.youtubePct}
                />
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top fontes
                  </h4>
                  <RankList
                    items={(data.top_sources ?? []).slice(0, 5)}
                    nameKey="source_name"
                    idKey="source_id"
                    sourceAvatars={sourceAvatars}
                  />
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top assuntos
                  </h4>
                  <RankList
                    items={(data.top_subjects ?? []).slice(0, 5)}
                    nameKey="subject_name"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (type === "month_presentation") {
    return (
      <MonthPresentationClient
        embedded
        reportId={reportId ?? null}
        reportPayload={payload}
        periodStart={periodStart ?? null}
        periodEnd={periodEnd ?? null}
        sourceAvatars={sourceAvatars}
      />
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
