import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Layers,
  LayoutDashboard,
  Map,
  Presentation,
  Radar,
  Rss,
  Tags,
} from "lucide-react";

export type ReportTypeKey =
  | "volume"
  | "top_sources"
  | "by_tags"
  | "activity_by_weekday"
  | "by_source_detail"
  | "top_subjects"
  | "radar_pauta"
  | "mapa_tematico"
  | "executive_summary"
  | "month_presentation";

export type ReportTypeMeta = {
  key: ReportTypeKey;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** Classe de acento visual (borda/fundo suave) */
  accentClass: string;
};

export const REPORT_TYPE_META: Record<ReportTypeKey, ReportTypeMeta> = {
  volume: {
    key: "volume",
    label: "Volume por período",
    blurb: "Série de artigos e vídeos no tempo",
    icon: BarChart3,
    accentClass:
      "border-[color-mix(in_srgb,var(--chart-1)_35%,transparent)] bg-[color-mix(in_srgb,var(--chart-1)_10%,transparent)]",
  },
  top_sources: {
    key: "top_sources",
    label: "Ranking de fontes",
    blurb: "Quem mais publicou no período",
    icon: Rss,
    accentClass:
      "border-[color-mix(in_srgb,var(--chart-2)_35%,transparent)] bg-[color-mix(in_srgb,var(--chart-2)_10%,transparent)]",
  },
  by_tags: {
    key: "by_tags",
    label: "Por tags",
    blurb: "Cobertura agregada por etiqueta",
    icon: Tags,
    accentClass:
      "border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
  },
  activity_by_weekday: {
    key: "activity_by_weekday",
    label: "Atividade por dia da semana",
    blurb: "Cadência Dom–Sáb de publicações",
    icon: CalendarDays,
    accentClass:
      "border-[color-mix(in_srgb,var(--chart-3)_35%,transparent)] bg-[color-mix(in_srgb,var(--chart-3)_10%,transparent)]",
  },
  by_source_detail: {
    key: "by_source_detail",
    label: "Detalhe por fonte",
    blurb: "Tags e volume de uma fonte",
    icon: Layers,
    accentClass:
      "border-[color-mix(in_srgb,var(--chart-4)_35%,transparent)] bg-[color-mix(in_srgb,var(--chart-4)_10%,transparent)]",
  },
  top_subjects: {
    key: "top_subjects",
    label: "Top assuntos",
    blurb: "Assuntos com mais cobertura",
    icon: LayoutDashboard,
    accentClass:
      "border-[color-mix(in_srgb,var(--chart-1)_35%,transparent)] bg-[color-mix(in_srgb,var(--chart-1)_10%,transparent)]",
  },
  radar_pauta: {
    key: "radar_pauta",
    label: "Radar de pauta",
    blurb: "Altas, quedas e novos vs período anterior",
    icon: Radar,
    accentClass:
      "border-emerald-500/30 bg-emerald-500/10",
  },
  mapa_tematico: {
    key: "mapa_tematico",
    label: "Mapa temático",
    blurb: "Clusters editoriais e share",
    icon: Map,
    accentClass:
      "border-sky-500/30 bg-sky-500/10",
  },
  executive_summary: {
    key: "executive_summary",
    label: "Resumo executivo",
    blurb: "Visão 7 / 30 / 90 dias",
    icon: Activity,
    accentClass:
      "border-[color-mix(in_srgb,var(--primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
  },
  month_presentation: {
    key: "month_presentation",
    label: "Apresentação mensal",
    blurb: "Dashboard e roteiro do mês",
    icon: Presentation,
    accentClass:
      "border-[color-mix(in_srgb,var(--primary)_45%,transparent)] bg-[linear-gradient(135deg,rgba(232,196,154,0.16),transparent)]",
  },
};

export const REPORT_TYPE_ORDER: ReportTypeKey[] = [
  "radar_pauta",
  "executive_summary",
  "month_presentation",
  "mapa_tematico",
  "volume",
  "top_subjects",
  "top_sources",
  "by_tags",
  "activity_by_weekday",
  "by_source_detail",
];

export const REPORT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(REPORT_TYPE_META).map((m) => [m.key, m.label])
);

export function getReportTypeMeta(type: string): ReportTypeMeta {
  const found = REPORT_TYPE_META[type as ReportTypeKey];
  if (found) return found;
  return {
    key: "volume",
    label: type,
    blurb: "Relatório gerado",
    icon: BarChart3,
    accentClass: "border-border/70 bg-muted/40",
  };
}
