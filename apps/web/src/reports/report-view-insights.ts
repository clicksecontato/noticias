export type ReportKpi = {
  label: string;
  value: string;
  note?: string;
};

export type RadarItemInsight = {
  subject_name: string;
  delta: number;
  delta_pct: number | null;
  trend: "up" | "down" | "new" | "stable" | string;
  total: number;
  previous_total: number;
};

export function buildRadarInsights(items: RadarItemInsight[]) {
  const up = items.filter((i) => i.trend === "up");
  const down = items.filter((i) => i.trend === "down");
  const neu = items.filter((i) => i.trend === "new");
  const stable = items.filter((i) => i.trend === "stable");

  const topUp = [...up].sort((a, b) => b.delta - a.delta).slice(0, 3);
  const topDown = [...down].sort((a, b) => a.delta - b.delta).slice(0, 3);

  const kpis: ReportKpi[] = [
    { label: "Em alta", value: String(up.length), note: "vs período anterior" },
    { label: "Em queda", value: String(down.length), note: "vs período anterior" },
    { label: "Novos", value: String(neu.length), note: "sem histórico" },
    { label: "Estáveis", value: String(stable.length), note: "sem variação" },
  ];

  const parts: string[] = [];
  if (neu.length === 1) parts.push("1 assunto novo entrou na pauta");
  else if (neu.length > 1) parts.push(`${neu.length} assuntos novos entraram na pauta`);
  if (topUp[0]) parts.push(`maior alta: ${topUp[0].subject_name} (+${topUp[0].delta})`);
  if (topDown[0]) parts.push(`maior queda: ${topDown[0].subject_name} (${topDown[0].delta})`);
  const insight =
    parts.length > 0
      ? parts.join("; ") + "."
      : "Sem movimento relevante vs o período anterior.";

  return { kpis, topUp, topDown, insight };
}

export function buildVolumeInsights(
  series: Array<{ date: string; articles: number; videos: number }>,
  totals: { articles: number; videos: number }
) {
  const withTotal = series.map((row) => ({
    ...row,
    total: row.articles + row.videos,
  }));
  const peak = withTotal.reduce<(typeof withTotal)[number] | null>((best, row) => {
    if (!best || row.total > best.total) return row;
    return best;
  }, null);
  const grand = totals.articles + totals.videos;
  const kpis: ReportKpi[] = [
    { label: "Artigos", value: String(totals.articles) },
    { label: "Vídeos", value: String(totals.videos) },
    { label: "Total", value: String(grand) },
    {
      label: "Pico",
      value: peak ? String(peak.total) : "0",
      note: peak?.date,
    },
  ];
  const insight = peak
    ? `Pico de volume em ${peak.date} (${peak.total} conteúdos). Mix: ${totals.articles} artigos e ${totals.videos} vídeos.`
    : "Sem série no período.";
  return { kpis, peak, insight };
}

export function buildRankingInsights(
  items: Array<{ name: string; total: number }>,
  noun: string
) {
  const grand = items.reduce((s, i) => s + i.total, 0) || 1;
  const leader = items[0];
  const top5 = items.slice(0, 5);
  const top5Total = top5.reduce((s, i) => s + i.total, 0);
  const leaderSharePct = leader ? Math.round((leader.total / grand) * 100) : 0;
  const top5SharePct = Math.round((top5Total / grand) * 100);

  const kpis: ReportKpi[] = [
    { label: `${noun.charAt(0).toUpperCase()}${noun.slice(1)}s`, value: String(items.length) },
    {
      label: "Líder",
      value: leader ? String(leader.total) : "0",
      note: leader?.name,
    },
    { label: "% do líder", value: `${leaderSharePct}%` },
    { label: "Top 5", value: `${top5SharePct}%`, note: "da cobertura" },
  ];

  const insight = leader
    ? `${leader.name} lidera com ${leaderSharePct}% da cobertura; o top 5 concentra ${top5SharePct}%.`
    : `Nenhum ${noun} no período.`;

  return {
    kpis,
    leaderName: leader?.name ?? null,
    leaderSharePct,
    top5SharePct,
    insight,
  };
}

export function buildWeekdayInsights(
  items: Array<{ label: string; total: number }>
) {
  const peak = items.reduce<(typeof items)[number] | null>((best, row) => {
    if (!best || row.total > best.total) return row;
    return best;
  }, null);
  const low = items.reduce<(typeof items)[number] | null>((worst, row) => {
    if (!worst || row.total < worst.total) return row;
    return worst;
  }, null);
  const grand = items.reduce((s, i) => s + i.total, 0) || 1;
  const peakShare = peak ? Math.round((peak.total / grand) * 100) : 0;

  const kpis: ReportKpi[] = [
    { label: "Dia de pico", value: peak?.label ?? "—", note: peak ? `${peak.total} itens` : undefined },
    { label: "Dia mais fraco", value: low?.label ?? "—", note: low ? `${low.total} itens` : undefined },
    { label: "% no pico", value: `${peakShare}%` },
    { label: "Total", value: String(grand) },
  ];

  const insight = peak
    ? `Maior volume em ${peak.label} (${peakShare}% do período)${low && low.label !== peak.label ? `; vale em ${low.label}` : ""}.`
    : "Sem atividade no período.";

  return {
    kpis,
    peakLabel: peak?.label ?? null,
    lowLabel: low?.label ?? null,
    insight,
  };
}

export function buildMapaInsights(
  clusters: Array<{ cluster_label: string; total: number; share_pct: number }>,
  totals: { articles: number; videos: number; total: number }
) {
  const dominant = [...clusters].sort((a, b) => b.total - a.total)[0];
  const kpis: ReportKpi[] = [
    { label: "Clusters", value: String(clusters.length) },
    {
      label: "Dominante",
      value: dominant ? `${dominant.share_pct}%` : "—",
      note: dominant?.cluster_label,
    },
    { label: "Artigos", value: String(totals.articles) },
    { label: "Vídeos", value: String(totals.videos) },
  ];
  const insight = dominant
    ? `${dominant.cluster_label} concentra ${dominant.share_pct}% da pauta temática (${dominant.total} menções).`
    : "Sem clusters no período.";
  return {
    kpis,
    dominantLabel: dominant?.cluster_label ?? null,
    insight,
  };
}

export function buildExecutiveInsights(input: {
  last7: { articles: number; videos: number; rssPct: number; youtubePct: number };
  last30: { articles: number; videos: number; rssPct: number; youtubePct: number };
  last90: { articles: number; videos: number; rssPct: number; youtubePct: number };
}) {
  const t7 = input.last7.articles + input.last7.videos;
  const t30 = input.last30.articles + input.last30.videos;
  const t90 = input.last90.articles + input.last90.videos;
  const avg7from30 = t30 / (30 / 7);
  const pacePct =
    avg7from30 > 0 ? Math.round(((t7 - avg7from30) / avg7from30) * 100) : 0;

  const kpis: ReportKpi[] = [
    { label: "7 dias", value: String(t7), note: `${input.last7.articles} art. · ${input.last7.videos} vid.` },
    { label: "30 dias", value: String(t30), note: `${input.last30.rssPct}% RSS` },
    { label: "90 dias", value: String(t90), note: `${input.last90.youtubePct}% YT` },
    {
      label: "Ritmo 7d",
      value: `${pacePct > 0 ? "+" : ""}${pacePct}%`,
      note: "vs média de 30d",
    },
  ];

  const insight =
    pacePct === 0
      ? `Nos últimos 7 dias o ritmo está alinhado à média de 30 dias (${t7} conteúdos).`
      : pacePct > 0
        ? `Nos últimos 7 dias o ritmo está ${pacePct}% acima da média de 30 dias — boa janela para pauta.`
        : `Nos últimos 7 dias o ritmo está ${Math.abs(pacePct)}% abaixo da média de 30 dias.`;

  return { kpis, insight, totals: { t7, t30, t90 }, pacePct };
}

export function buildSourceDetailInsights(input: {
  articles_total: number;
  videos_total: number;
  tags: Array<{ tag_name: string; count: number }>;
}) {
  const leader = [...input.tags].sort((a, b) => b.count - a.count)[0];
  const tagSum = input.tags.reduce((s, t) => s + t.count, 0);
  const kpis: ReportKpi[] = [
    { label: "Artigos", value: String(input.articles_total) },
    { label: "Vídeos", value: String(input.videos_total) },
    { label: "Tags", value: String(input.tags.length) },
    {
      label: "Tag líder",
      value: leader ? String(leader.count) : "0",
      note: leader?.tag_name,
    },
  ];
  const insight = leader
    ? `${leader.tag_name} lidera as tags desta fonte (${leader.count} de ${tagSum} vínculos).`
    : "Fonte sem tags no período.";
  return { kpis, leaderTag: leader?.tag_name ?? null, insight };
}
