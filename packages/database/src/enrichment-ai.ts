/**
 * Extração de entidades (jogos, tags, gêneros, plataformas) a partir de texto
 * usando a API Gemini. Usado no enriquecimento automático na ingestão.
 */

export interface ExtractEntitiesResult {
  games: string[];
  tags: string[];
  genres: string[];
  platforms: string[];
}

const MAX_ITEMS_PER_CATEGORY = 10;
/** Model ID; override with env GEMINI_MODEL if needed (e.g. gemini-2.0-flash, gemini-flash-latest). */
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Cooldown em ms após 429 (quota excedida). Enquanto em cooldown, não chamamos a API. */
let quotaExceededUntil = 0;

function getEnv(env: Record<string, string | undefined> = process.env) {
  const provider = env.ENRICHMENT_AI_PROVIDER?.trim().toLowerCase();
  const apiKey = env.GEMINI_API_KEY?.trim();
  return { provider, apiKey };
}

function getCooldownMs(env: Record<string, string | undefined> = process.env): number {
  const hours = Number(env.ENRICHMENT_AI_QUOTA_COOLDOWN_HOURS?.trim());
  if (Number.isFinite(hours) && hours > 0) return hours * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000; // 24h padrão
}

/** Quando true, a IA não será chamada (quota em cooldown). */
export function isEnrichmentAiInCooldown(): boolean {
  return Date.now() < quotaExceededUntil;
}

export function isEnrichmentAiEnabled(env?: Record<string, string | undefined>): boolean {
  const e = env ?? process.env;
  const { provider, apiKey } = getEnv(e);
  if (provider !== "gemini" || !apiKey) return false;
  if (Date.now() < quotaExceededUntil) return false;
  return true;
}

function clampToArrays(obj: unknown): ExtractEntitiesResult {
  const result: ExtractEntitiesResult = {
    games: [],
    tags: [],
    genres: [],
    platforms: []
  };
  if (!obj || typeof obj !== "object") return result;
  const o = obj as Record<string, unknown>;
  for (const key of ["games", "tags", "genres", "platforms"] as const) {
    const val = o[key];
    if (Array.isArray(val)) {
      result[key] = val
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, MAX_ITEMS_PER_CATEGORY);
    }
  }
  return result;
}

/**
 * Chama a API Gemini para extrair jogos, tags, gêneros e plataformas do texto.
 * Retorna listas de nomes (não IDs). Em caso de erro ou resposta inválida, retorna listas vazias.
 */
export async function extractEntitiesWithGemini(
  title: string,
  description: string,
  env: Record<string, string | undefined> = process.env
): Promise<ExtractEntitiesResult> {
  const { provider, apiKey } = getEnv(env);
  if (provider !== "gemini" || !apiKey) {
    return { games: [], tags: [], genres: [], platforms: [] };
  }
  if (Date.now() < quotaExceededUntil) {
    return { games: [], tags: [], genres: [], platforms: [] };
  }
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const text = `${title}\n\n${description}`.slice(0, 2000);
  const prompt = `Analise o texto abaixo (título e resumo de uma notícia de jogos) e extraia entidades.
Retorne APENAS um JSON válido, sem markdown, sem \`\`\`json, no formato:
{"games":["Nome do Jogo 1"],"tags":["tag1"],"genres":["gênero1"],"platforms":["plataforma1"]}
Use listas vazias [] para categorias sem itens. Nomes em português quando fizer sentido.
Máximo ${MAX_ITEMS_PER_CATEGORY} itens por categoria. Apenas entidades realmente mencionadas ou fortemente sugeridas no texto.

Texto:
---
${text}
---`;

  const url = `${GEMINI_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) {
        quotaExceededUntil = Date.now() + getCooldownMs(env);
        console.warn(
          "[enrichment-ai] Quota excedida (429). IA desativada por",
          Math.round(getCooldownMs(env) / 3600000),
          "h. Use apenas enriquecimento por texto até lá."
        );
      } else {
        console.warn("[enrichment-ai] Gemini API error:", res.status, errText);
      }
      return { games: [], tags: [], genres: [], platforms: [] };
    }

    interface GeminiCandidate {
      content?: { parts?: Array<{ text?: string }> };
    }
    const data = (await res.json()) as { candidates?: GeminiCandidate[] };
    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textPart || typeof textPart !== "string") {
      return { games: [], tags: [], genres: [], platforms: [] };
    }

    const firstBrace = textPart.indexOf("{");
    const lastBrace = textPart.lastIndexOf("}");
    const raw = firstBrace >= 0 && lastBrace > firstBrace ? textPart.slice(firstBrace, lastBrace + 1) : "{}";
    const parsed = JSON.parse(raw) as unknown;
    return clampToArrays(parsed);
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof SyntaxError) {
      console.warn("[enrichment-ai] Invalid JSON from Gemini:", (e as Error).message);
    } else {
      console.warn("[enrichment-ai] Gemini request failed:", (e as Error).message);
    }
    return { games: [], tags: [], genres: [], platforms: [] };
  }
}
