import { getSeoConfig } from "./config";
import { getSeoStrategy } from "./strategy";

export interface MetadataInput {
  pageType: "game" | "news" | "genre";
  entityName: string;
  genre?: string;
  platform?: string;
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
  const title = strategy.titleTemplate(input.entityName, input.platform);
  let description = "";

  if (input.pageType === "game") {
    description = `Veja tudo sobre ${input.entityName}: novidades, gameplay, plataformas suportadas e dicas para aproveitar melhor a experiencia no jogo.`;
  }

  if (input.pageType === "news") {
    description = `Acompanhe ${input.entityName} com cobertura rapida, contexto completo e atualizacoes relevantes do mercado de games em tempo real.`;
  }

  if (input.pageType === "genre") {
    const platformPart = input.platform ? ` para ${input.platform}` : "";
    description = `Encontre os melhores jogos de ${input.entityName}${platformPart}, com listas atualizadas, comparativos e recomendacoes para diferentes perfis de jogadores.`;
  }

  return {
    title: trimToLength(title, 60),
    description: clampDescription(description)
  };
}
