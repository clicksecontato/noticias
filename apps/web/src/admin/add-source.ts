export type AddSourceProvider = "rss" | "youtube";

export interface AddSourceFormValues {
  id: string;
  name: string;
  provider: AddSourceProvider;
  rss_url: string;
  channel_id: string;
  language: string;
}

export type AddSourceRequestBody = {
  id: string;
  name: string;
  language: string;
  provider: AddSourceProvider;
  rss_url?: string;
  channel_id?: string;
};

export type BuildAddSourceResult =
  | { ok: true; body: AddSourceRequestBody }
  | { ok: false; error: string };

/**
 * Valida e monta o body do POST /api/admin/sources.
 * Função pura para reuso em Fontes e Ingestão.
 */
export function buildAddSourceRequestBody(
  values: AddSourceFormValues
): BuildAddSourceResult {
  const name = values.name.trim();
  const language = values.language.trim() || "pt-BR";
  if (!name) {
    return { ok: false, error: "Nome é obrigatório." };
  }

  if (values.provider === "youtube") {
    const channelId = values.channel_id.trim();
    if (!channelId) {
      return {
        ok: false,
        error: "Informe a URL do canal (o ID da fonte é gerado automaticamente).",
      };
    }
    return {
      ok: true,
      body: {
        id: values.id.trim(),
        name,
        language,
        provider: "youtube",
        channel_id: channelId,
      },
    };
  }

  const rssUrl = values.rss_url.trim();
  if (!rssUrl) {
    return { ok: false, error: "URL do feed RSS é obrigatória." };
  }
  const id = values.id.trim();
  if (!id) {
    return { ok: false, error: "ID da fonte é obrigatório para RSS." };
  }
  return {
    ok: true,
    body: {
      id,
      name,
      language,
      provider: "rss",
      rss_url: rssUrl,
    },
  };
}

export const EMPTY_ADD_SOURCE_FORM: AddSourceFormValues = {
  id: "",
  name: "",
  provider: "rss",
  rss_url: "",
  channel_id: "",
  language: "pt-BR",
};
