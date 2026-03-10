export interface WebConfig {
  siteUrl: string;
  descriptionSuffix: string;
}

const DEFAULT_SITE_URL = "https://www.noticiasgames.com";
const DEFAULT_DESCRIPTION_SUFFIX =
  "Conteudo atualizado com contexto, comparativos e recomendacoes praticas para facilitar sua descoberta de jogos.";

export function getWebConfig(
  env: Record<string, string | undefined> = process.env
): WebConfig {
  return {
    siteUrl: env.WEB_SITE_URL?.trim() || DEFAULT_SITE_URL,
    descriptionSuffix: env.WEB_DESCRIPTION_SUFFIX?.trim() || DEFAULT_DESCRIPTION_SUFFIX
  };
}
