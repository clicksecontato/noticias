import { getSeoConfig } from "./config";
import { getSeoStrategy } from "./strategy";
import type { SeoPageType } from "./strategy";

export interface MetadataInput {
  pageType: SeoPageType;
  entityName: string;
  type?: string;
}

export interface MetadataOutput {
  title: string;
  description: string;
}

function trimToLength(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function clampDescription(text: string): string {
  const min = 120;
  const max = 160;
  const { metadataDescriptionSuffix } = getSeoConfig();
  let value = text.trim();

  if (value.length > max) {
    value = trimToLength(value, max);
  }

  if (value.length < min) {
    value = `${value} ${metadataDescriptionSuffix}`;
    value = trimToLength(value, max);
  }

  if (value.length < min) {
    value = value.padEnd(min, ".");
  }

  return value;
}

export function buildMetadata(input: MetadataInput): MetadataOutput {
  const strategy = getSeoStrategy(input.pageType);
  const title = strategy.titleTemplate(input.entityName);
  let description = "";

  if (input.pageType === "subject") {
    description = `Veja tudo sobre ${input.entityName}: noticias, atualizacoes, contexto e analises para acompanhar o assunto com profundidade.`;
  }

  if (input.pageType === "news") {
    description = `Acompanhe ${input.entityName} com cobertura rapida, contexto completo e atualizacoes relevantes do mundo das noticias em tempo real.`;
  }

  if (input.pageType === "type") {
    description = `Encontre os melhores assuntos de ${input.entityName}, com listas atualizadas, comparativos e recomendacoes para diferentes interesses.`;
  }

  return {
    title: trimToLength(title, 60),
    description: clampDescription(description)
  };
}
