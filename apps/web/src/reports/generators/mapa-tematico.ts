import {
  resolveThemeCluster,
  slugifySubjectKey,
  THEME_CLUSTER_IDS,
  THEME_CLUSTER_LABELS,
  type ThemeClusterId,
} from "../theme-cluster-strategy";

export type SubjectCountRow = {
  subject_id: string;
  subject_name: string;
  subject_slug?: string;
  articles: number;
  videos: number;
  total: number;
};

export type MapaTematicoSubjectItem = {
  subject_id: string;
  subject_name: string;
  subject_slug: string;
  articles: number;
  videos: number;
  total: number;
};

export type MapaTematicoCluster = {
  cluster_id: ThemeClusterId;
  cluster_label: string;
  articles: number;
  videos: number;
  total: number;
  share_pct: number;
  subjects: MapaTematicoSubjectItem[];
};

export type MapaTematicoPayload = {
  period: { start: string; end: string };
  clusters: MapaTematicoCluster[];
  totals: { articles: number; videos: number; total: number };
};

export function generateMapaTematicoReport(
  subjectCounts: SubjectCountRow[],
  options: {
    periodStart: string;
    periodEnd: string;
    /** Máximo de assuntos listados por cluster (já ordenados por total). */
    limit_subjects?: number;
  }
): MapaTematicoPayload {
  const limit = options.limit_subjects ?? 8;

  type Acc = {
    articles: number;
    videos: number;
    total: number;
    subjects: MapaTematicoSubjectItem[];
  };

  const byCluster = new Map<ThemeClusterId, Acc>();
  for (const id of THEME_CLUSTER_IDS) {
    byCluster.set(id, { articles: 0, videos: 0, total: 0, subjects: [] });
  }

  for (const row of subjectCounts) {
    const slug =
      row.subject_slug?.trim() ||
      (row.subject_name ? slugifySubjectKey(row.subject_name) : row.subject_id);
    const clusterId = resolveThemeCluster(row.subject_slug, row.subject_name);
    const acc = byCluster.get(clusterId)!;
    acc.articles += row.articles;
    acc.videos += row.videos;
    acc.total += row.total;
    acc.subjects.push({
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      subject_slug: slug,
      articles: row.articles,
      videos: row.videos,
      total: row.total,
    });
  }

  const grandTotal = [...byCluster.values()].reduce((s, c) => s + c.total, 0);
  const grandArticles = [...byCluster.values()].reduce((s, c) => s + c.articles, 0);
  const grandVideos = [...byCluster.values()].reduce((s, c) => s + c.videos, 0);

  const clusters: MapaTematicoCluster[] = THEME_CLUSTER_IDS.map((cluster_id) => {
    const acc = byCluster.get(cluster_id)!;
    const subjects = [...acc.subjects]
      .sort((a, b) => b.total - a.total || a.subject_name.localeCompare(b.subject_name))
      .slice(0, limit);
    const sharePct =
      grandTotal === 0 ? 0 : Math.round((acc.total / grandTotal) * 1000) / 10;
    return {
      cluster_id,
      cluster_label: THEME_CLUSTER_LABELS[cluster_id],
      articles: acc.articles,
      videos: acc.videos,
      total: acc.total,
      share_pct: sharePct,
      subjects,
    };
  }).filter((c) => c.total > 0 || c.cluster_id === "outros");

  // Mantém "outros" só se tiver volume; remove se vazio
  const filtered = clusters.filter(
    (c) => c.cluster_id !== "outros" || c.total > 0
  );

  return {
    period: { start: options.periodStart, end: options.periodEnd },
    clusters: filtered,
    totals: {
      articles: grandArticles,
      videos: grandVideos,
      total: grandTotal,
    },
  };
}
