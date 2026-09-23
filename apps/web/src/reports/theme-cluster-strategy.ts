/**
 * Estratégia de agrupamento editorial: assunto (slug) → cluster temático.
 * Slugs sem mapeamento caem em "outros".
 */

export const THEME_CLUSTER_IDS = [
  "labs_produtos",
  "capacidades",
  "regulacao",
  "infra",
  "mercado_geo",
  "outros",
] as const;

export type ThemeClusterId = (typeof THEME_CLUSTER_IDS)[number];

export const THEME_CLUSTER_LABELS: Record<ThemeClusterId, string> = {
  labs_produtos: "Labs e produtos",
  capacidades: "Capacidades",
  regulacao: "Regulação e governança",
  infra: "Infraestrutura",
  mercado_geo: "Mercado e geopolítica",
  outros: "Outros",
};

const SLUG_TO_CLUSTER: Record<string, Exclude<ThemeClusterId, "outros">> = {
  // Labs e produtos
  openai: "labs_produtos",
  chatgpt: "labs_produtos",
  anthropic: "labs_produtos",
  claude: "labs_produtos",
  google: "labs_produtos",
  gemini: "labs_produtos",
  veo: "labs_produtos",
  meta: "labs_produtos",
  llama: "labs_produtos",
  microsoft: "labs_produtos",
  copilot: "labs_produtos",
  amazon: "labs_produtos",
  apple: "labs_produtos",
  nvidia: "labs_produtos",
  deepseek: "labs_produtos",
  xai: "labs_produtos",
  grok: "labs_produtos",
  mistral: "labs_produtos",
  cohere: "labs_produtos",
  perplexity: "labs_produtos",
  "hugging-face": "labs_produtos",
  "stability-ai": "labs_produtos",
  midjourney: "labs_produtos",
  sora: "labs_produtos",
  cursor: "labs_produtos",
  qwen: "labs_produtos",

  // Capacidades
  agentes: "capacidades",
  "agentic-ai": "capacidades",
  rag: "capacidades",
  multimodal: "capacidades",
  llm: "capacidades",
  embeddings: "capacidades",
  "fine-tuning": "capacidades",
  prompting: "capacidades",
  "prompt-injection": "capacidades",
  "tool-use": "capacidades",
  mcp: "capacidades",
  ocr: "capacidades",
  "visao-computacional": "capacidades",
  voz: "capacidades",
  audio: "capacidades",
  video: "capacidades",
  imagem: "capacidades",
  codigo: "capacidades",
  "codigo-aberto": "capacidades",
  "modelo-aberto": "capacidades",
  "modelo-fronteira": "capacidades",
  "open-vs-closed": "capacidades",
  "contexto-longo": "capacidades",
  raciocinio: "capacidades",
  "world-models": "capacidades",
  "ia-generativa": "capacidades",
  "ia-fisica": "capacidades",
  robotica: "capacidades",
  automacao: "capacidades",
  assistente: "capacidades",
  copilotos: "capacidades",
  busca: "capacidades",
  traducao: "capacidades",
  produtividade: "capacidades",
  atendimento: "capacidades",
  avaliacao: "capacidades",
  benchmark: "capacidades",
  alinhamento: "capacidades",
  guardrails: "capacidades",
  jailbreak: "capacidades",
  "dados-sinteticos": "capacidades",
  dataset: "capacidades",
  api: "capacidades",

  // Regulação e governança
  regulacao: "regulacao",
  "ai-act": "regulacao",
  lgpd: "regulacao",
  "pl-2338": "regulacao",
  governanca: "regulacao",
  privacidade: "regulacao",
  copyright: "regulacao",
  direito: "regulacao",
  transparencia: "regulacao",
  "setor-publico": "regulacao",
  "soberania-digital": "regulacao",
  desinformacao: "regulacao",
  deepfake: "regulacao",
  ciberseguranca: "regulacao",
  seguranca: "regulacao",

  // Infraestrutura
  gpu: "infra",
  chip: "infra",
  semicondutores: "infra",
  "data-center": "infra",
  cloud: "infra",
  edge: "infra",
  "on-device": "infra",
  inferencia: "infra",
  serving: "infra",
  quantizacao: "infra",
  tokens: "infra",
  treinamento: "infra",

  // Mercado e geopolítica
  brasil: "mercado_geo",
  china: "mercado_geo",
  eua: "mercado_geo",
  "america-latina": "mercado_geo",
  "uniao-europeia": "mercado_geo",
  empresas: "mercado_geo",
  enterprise: "mercado_geo",
  startup: "mercado_geo",
  investimento: "mercado_geo",
  aquisicao: "mercado_geo",
  parceria: "mercado_geo",
  concorrencia: "mercado_geo",
  precificacao: "mercado_geo",
  financas: "mercado_geo",
  talento: "mercado_geo",
  educacao: "mercado_geo",
  ciencia: "mercado_geo",
  marketing: "mercado_geo",
  midia: "mercado_geo",
  mobilidade: "mercado_geo",
};

/** Normaliza nome/exibição para slug quando o repositório não envia slug. */
export function slugifySubjectKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveThemeCluster(
  subjectSlug: string | null | undefined,
  subjectName?: string
): ThemeClusterId {
  const key =
    (subjectSlug && subjectSlug.trim()) ||
    (subjectName ? slugifySubjectKey(subjectName) : "");
  if (!key) return "outros";
  return SLUG_TO_CLUSTER[key] ?? "outros";
}
