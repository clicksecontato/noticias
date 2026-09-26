import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityWeekdayChart } from "../components/reports/ActivityWeekdayChart";
import { TagNewsChart } from "../components/reports/TagNewsChart";
import { TopSubjectsChart } from "../components/reports/TopSubjectsChart";
import { RadarPautaChart } from "../components/reports/RadarPautaChart";
import { MapaTematicoChart } from "../components/reports/MapaTematicoChart";
import { TopSourcesChart } from "../components/reports/TopSourcesChart";
import { VolumeChart } from "../components/reports/VolumeChart";
import { ReportCollapsibleTable } from "../components/reports/ReportCollapsibleTable";
import { ReportTrendBadge } from "../components/reports/ReportShell";
import { PIE_COLORS } from "@/src/ui/chart-gradients";
import {
  buildExecutiveInsights,
  buildMapaInsights,
  buildRadarInsights,
  buildRankingInsights,
  buildSourceDetailInsights,
  buildVolumeInsights,
  buildWeekdayInsights,
} from "../../src/reports/report-view-insights";
import { PresentationStage, Slide } from "../components/reports/PresentationStage";
import { MonthPresentationClient } from "../admin/month-presentation/MonthPresentationClient";
import { YoutubeFormatoView } from "./YoutubeFormatoView";
import { ThumbsReportView } from "../components/reports/ThumbsReportView";
import {
  ByTypesView,
  EmPortuguesView,
  PerspectivasView,
} from "../components/reports/EditorialPautaViews";
import type { YoutubeFormatoPayload } from "@/src/reports/generators/youtube-formato";
import type { ThumbsPayload } from "@/src/reports/generators/thumbs";
import type {
  ByTypesPayload,
  EmPortuguesPayload,
  PerspectivasPayload,
} from "@/src/reports/generators/editorial-pautas";
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
          <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">{item.total}</p>
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
    const { insight } = buildVolumeInsights(rawSeries, totals);
    const articlesShare =
      totals.articles + totals.videos > 0
        ? Math.round((totals.articles / (totals.articles + totals.videos)) * 100)
        : 0;
    const periodLabel = groupBy === "day" ? "por dia" : groupBy === "week" ? "por semana" : "por mês";
    return (
      <PresentationStage kicker="Volume">
        <Slide title="Vídeos no período">
          <div className="grid h-full content-center gap-6 sm:grid-cols-2">
            <div>
              <p className="text-base text-muted-foreground">Vídeos dos canais</p>
              <p className="text-7xl font-semibold tabular-nums tracking-tight">{totals.videos}</p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Artigos RSS</p>
              <p className="text-7xl font-semibold tabular-nums tracking-tight">{totals.articles}</p>
            </div>
            <p className="text-lg text-muted-foreground sm:col-span-2">{insight}</p>
          </div>
        </Slide>
        <Slide title={`Série ${periodLabel}`}>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <MixBar rssPct={articlesShare} youtubePct={100 - articlesShare} />
            <div className="min-h-0 flex-1">
              <VolumeChart data={series} groupBy={groupBy} fill />
            </div>
          </div>
        </Slide>
        <Slide title="Série completa">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Série completa" rowCount={series.length} defaultOpen>
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
          </div>
        </Slide>
      </PresentationStage>
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
    const channels = items
      .filter((item) => item.videos > 0)
      .sort((a, b) => b.videos - a.videos);
    const { insight } = buildRankingInsights(
      channels.map((i) => ({ name: i.source_name, total: i.videos })),
      "fonte"
    );
    return (
      <PresentationStage kicker="Canais do YouTube">
        <Slide title="Canais em destaque">
          <div className="flex h-full min-h-0 flex-col justify-center gap-6">
            <p className="text-lg text-muted-foreground">{insight}</p>
            <Podium
              items={channels.map((i) => ({
                name: i.source_name,
                total: i.videos,
                note: "vídeos no período",
                imageUrl: avatarFor(sourceAvatars, i.source_id),
              }))}
            />
          </div>
        </Slide>
        <Slide title="Vídeos por canal">
          <div className="min-h-0 flex-1">
            <TopSourcesChart
              data={channels.map((item) => ({ ...item, articles: 0, total: item.videos }))}
              fill
            />
          </div>
        </Slide>
        <Slide title="Ranking dos canais">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Ranking completo" rowCount={channels.length} defaultOpen>
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
                {channels.map((row, i) => (
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
          </div>
        </Slide>
      </PresentationStage>
    );
  }

  if (type === "by_tags") {
    const items =
      (payload.items as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    const { insight } = buildRankingInsights(
      items.map((i) => ({ name: i.tag_name, total: i.count })),
      "tag"
    );
    return (
      <PresentationStage kicker="Tags">
        <Slide title="Tags em destaque">
          <div className="flex h-full min-h-0 flex-col justify-center gap-6">
            <p className="text-lg text-muted-foreground">{insight}</p>
            <Podium items={items.map((i) => ({ name: i.tag_name, total: i.count }))} />
          </div>
        </Slide>
        <Slide title="Notícias por tag">
          <div className="min-h-0 flex-1">
            <TagNewsChart data={items} fill dateFrom={periodStart} dateTo={periodEnd} />
          </div>
        </Slide>
        <Slide title="Lista de tags">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Tags" rowCount={items.length} defaultOpen>
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
          </div>
        </Slide>
      </PresentationStage>
    );
  }

  if (type === "by_source_detail") {
    const sourceId = (payload.source_id as string) ?? "";
    const sourceName = (payload.source_name as string) ?? sourceId;
    const articlesTotal = Number(payload.articles_total ?? 0);
    const videosTotal = Number(payload.videos_total ?? 0);
    const tags =
      (payload.tags as Array<{ tag_id: string; tag_name: string; count: number }>) ?? [];
    const { insight } = buildSourceDetailInsights({
      articles_total: articlesTotal,
      videos_total: videosTotal,
      tags,
    });
    return (
      <PresentationStage kicker="Canal">
        <Slide title={sourceName}>
          <div className="flex h-full items-center gap-6">
            <SourceAvatar
              name={sourceName}
              imageUrl={avatarFor(sourceAvatars, sourceId)}
              size="md"
              className="size-24"
            />
            <div>
              <p className="text-base text-muted-foreground">Vídeos no período</p>
              <p className="text-7xl font-semibold tabular-nums tracking-tight">{videosTotal}</p>
              <p className="mt-3 max-w-xl text-lg text-muted-foreground">{insight}</p>
            </div>
          </div>
        </Slide>
        <Slide title="Tags do canal">
          <div className="min-h-0 flex-1">
            <TagNewsChart
              data={tags}
              fill
              dateFrom={periodStart}
              dateTo={periodEnd}
              sourceId={sourceId}
            />
          </div>
        </Slide>
        <Slide title="Lista de tags">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Tags da fonte" rowCount={tags.length} defaultOpen>
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
          </div>
        </Slide>
      </PresentationStage>
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
    const byVideos = [...items].sort((a, b) => b.videos - a.videos || b.total - a.total);
    const { insight } = buildRankingInsights(
      byVideos.map((i) => ({ name: i.subject_name, total: i.videos })),
      "assunto"
    );
    return (
      <PresentationStage kicker="Top assuntos">
        <Slide title="Assuntos nos canais">
          <div className="flex h-full min-h-0 flex-col justify-center gap-6">
            <p className="text-lg text-muted-foreground">{insight}</p>
            <Podium
              items={byVideos.map((i) => ({
                name: i.subject_name,
                total: i.videos,
                note: "vídeos no período",
              }))}
            />
          </div>
        </Slide>
        <Slide title="Vídeos por assunto">
          <div className="min-h-0 flex-1">
            <TopSubjectsChart
              data={byVideos.map((item) => ({ ...item, articles: 0, total: item.videos }))}
              fill
            />
          </div>
        </Slide>
        <Slide title="Lista de assuntos">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Assuntos" rowCount={byVideos.length} defaultOpen>
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
                {byVideos.map((row, i) => (
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
          </div>
        </Slide>
      </PresentationStage>
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
    const { topUp, topDown, insight } = buildRadarInsights(items);

    return (
      <PresentationStage kicker="Radar de pauta">
        <Slide title="Leitura do período">
          <p className="max-w-4xl text-3xl leading-relaxed">{insight}</p>
        </Slide>
        <Slide title="Maiores altas">
          <div className="theme-scrollbar flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto">
              {topUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alta no período.</p>
              ) : (
                topUp.map((row) => (
                  <div
                    key={row.subject_name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-emerald-500/5 px-3 py-2"
                  >
                    <span className="truncate text-2xl font-medium">{row.subject_name}</span>
                    <span className="shrink-0 tabular-nums text-2xl font-semibold text-emerald-300">
                      +{row.delta}
                      {row.delta_pct != null ? ` (${row.delta_pct > 0 ? "+" : ""}${row.delta_pct}%)` : ""}
                    </span>
                  </div>
                ))
              )}
          </div>
        </Slide>
        <Slide title="Maiores quedas">
          <div className="theme-scrollbar flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto">
              {topDown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma queda no período.</p>
              ) : (
                topDown.map((row) => (
                  <div
                    key={row.subject_name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-rose-500/5 px-3 py-2"
                  >
                    <span className="truncate text-2xl font-medium">{row.subject_name}</span>
                    <span className="shrink-0 tabular-nums text-2xl font-semibold text-rose-300">
                      {row.delta}
                      {row.delta_pct != null ? ` (${row.delta_pct}%)` : ""}
                    </span>
                  </div>
                ))
              )}
          </div>
        </Slide>
        <Slide title="Movimento da pauta">
          <div className="min-h-0 flex-1">
            <RadarPautaChart data={items} fill />
          </div>
        </Slide>
        <Slide title="Movimento completo">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ReportCollapsibleTable title="Movimento completo" rowCount={items.length} defaultOpen>
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
          </div>
        </Slide>
      </PresentationStage>
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
    const { insight } = buildMapaInsights(clusters, totals);

    return (
      <PresentationStage kicker="Mapa temático">
        <Slide title="Leitura do mapa">
          <p className="max-w-4xl text-3xl leading-relaxed">{insight}</p>
        </Slide>
        <Slide title="Share por cluster">
          <div className="min-h-0 flex-1">
            <MapaTematicoChart data={clusters} fill />
          </div>
        </Slide>
        {clusters.map((cluster, index) => {
          const subjects = [...cluster.subjects].sort(
            (a, b) => b.videos - a.videos || b.total - a.total
          );
          const color = PIE_COLORS[index % PIE_COLORS.length];
          return (
            <Slide key={cluster.cluster_id} title={cluster.cluster_label}>
              <div className="flex h-full min-h-0 flex-col gap-6">
                <p className="flex items-center gap-3 text-2xl text-muted-foreground">
                  <span
                    className="size-4 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  {cluster.share_pct}% do período · {cluster.videos} vídeos
                </p>
                {subjects.length === 0 ? (
                  <p className="text-xl text-muted-foreground">Nenhum assunto neste grupo.</p>
                ) : (
                  <ul className="theme-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {subjects.map((subject, subjectIndex) => (
                      <li
                        key={subject.subject_id}
                        className="flex items-baseline justify-between gap-6 border-b border-border/60 py-3"
                      >
                        <span className="text-2xl font-medium">
                          {subjectIndex + 1}. {subject.subject_name}
                        </span>
                        <span className="shrink-0 text-2xl tabular-nums text-muted-foreground">
                          {subject.videos} vídeos
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Slide>
          );
        })}
      </PresentationStage>
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
    const { insight, peakLabel } = buildWeekdayInsights(items);

    return (
      <PresentationStage kicker="Dia da semana">
        <Slide title="Pico da semana">
          <div className="flex h-full flex-col justify-center gap-4">
            <p className="text-base text-muted-foreground">Dia de pico</p>
            <p className="text-7xl font-semibold tracking-tight">{peakLabel}</p>
            <p className="max-w-3xl text-2xl text-muted-foreground">{insight}</p>
          </div>
        </Slide>
        <Slide title="Publicações por dia">
          <div className="min-h-0 flex-1">
            <ActivityWeekdayChart data={items} fill />
          </div>
        </Slide>
        <Slide title="Por dia da semana">
          <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
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
          </div>
        </Slide>
      </PresentationStage>
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

    const { insight } = buildExecutiveInsights({
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
      <PresentationStage kicker="Resumo executivo">
        <Slide title="Visão geral">
          <div className="flex h-full flex-col justify-center gap-4">
            <p className="text-base text-muted-foreground">
              Até {referenceDate ? formatYMDAsPTBR(referenceDate) : "—"}
            </p>
            <p className="max-w-4xl text-3xl leading-relaxed">{insight}</p>
          </div>
        </Slide>
        {windows.map(({ title, data }) => {
          const channels = (data.top_sources ?? [])
            .filter((source) => source.videos > 0)
            .sort((a, b) => b.videos - a.videos)
            .slice(0, 5)
            .map((source) => ({ ...source, total: source.videos }));
          const subjects = [...(data.top_subjects ?? [])]
            .sort((a, b) => b.videos - a.videos)
            .slice(0, 5)
            .map((subject) => ({ ...subject, total: subject.videos }));
          return (
            <Slide key={title} title={title}>
              <div className="grid h-full min-h-0 content-center gap-8 lg:grid-cols-[auto_1fr_1fr]">
                <div>
                  <p className="text-base text-muted-foreground">Vídeos dos canais</p>
                  <p className="text-7xl font-semibold tabular-nums tracking-tight">{data.videos}</p>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-medium">Canais</h3>
                  <RankList
                    items={channels}
                    nameKey="source_name"
                    idKey="source_id"
                    sourceAvatars={sourceAvatars}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-medium">Assuntos</h3>
                  <RankList items={subjects} nameKey="subject_name" />
                </div>
              </div>
            </Slide>
          );
        })}
      </PresentationStage>
    );
  }

  if (type === "youtube_formato") {
    return (
      <YoutubeFormatoView payload={payload as unknown as YoutubeFormatoPayload} />
    );
  }

  if (type === "thumb_analysis") {
    return (
      <ThumbsReportView
        payload={payload as unknown as ThumbsPayload}
        sourceAvatars={sourceAvatars}
      />
    );
  }

  if (type === "perspectivas") {
    return (
      <PerspectivasView
        payload={payload as unknown as PerspectivasPayload}
        sourceAvatars={sourceAvatars}
      />
    );
  }

  if (type === "em_portugues") {
    return (
      <EmPortuguesView
        payload={payload as unknown as EmPortuguesPayload}
        sourceAvatars={sourceAvatars}
      />
    );
  }

  if (type === "by_types") {
    return <ByTypesView payload={payload as unknown as ByTypesPayload} />;
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
