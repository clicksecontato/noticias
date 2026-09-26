/** Títulos de videoCategories do YouTube em pt-BR. */
const YOUTUBE_CATEGORY_LABELS: Record<string, string> = {
  "1": "Filmes e desenhos",
  "2": "Automóveis e veículos",
  "10": "Música",
  "15": "Animais de estimação e animais",
  "17": "Esportes",
  "19": "Viagens e eventos",
  "20": "Jogos",
  "22": "Pessoas e blogs",
  "23": "Comédia",
  "24": "Entretenimento",
  "25": "Notícias e política",
  "26": "Como fazer e estilo",
  "27": "Educação",
  "28": "Ciência e tecnologia",
  "29": "Organizações sem fins lucrativos e ativismo",
};

export function formatDurationSeconds(total: number | null | undefined): string {
  if (total == null || total < 0) return "—";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
  return `${seconds}s`;
}

export function formatLiveBroadcast(value: string | null | undefined): string {
  if (value === "live") return "Ao vivo";
  if (value === "upcoming") return "Estreia";
  if (value === "none") return "Gravado";
  return "—";
}

export function formatYoutubeCategory(categoryId: string | null | undefined): string {
  if (!categoryId) return "—";
  return YOUTUBE_CATEGORY_LABELS[categoryId] ?? categoryId;
}

export function formatCaptionFlag(value: boolean | null | undefined): string {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "—";
}

/** Último segmento de uma URL de tópico Wikipedia. */
export function formatTopicCategory(url: string): string {
  const slug = url.split("/").filter(Boolean).pop() ?? url;
  return decodeURIComponent(slug).replaceAll("_", " ");
}
