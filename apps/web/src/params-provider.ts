import type { PublishingPageType } from "./page-strategy";

export type StaticRouteParam = Record<string, string>;

export function getStaticRouteParams(
  pageType: PublishingPageType
): StaticRouteParam[] {
  if (pageType === "news") {
    return [
      { slug: "openai-lanca-atualizacao-chatgpt" },
      { slug: "anthropic-atualiza-claude" }
    ];
  }

  if (pageType === "subject" || pageType === "subjects-like") {
    return [{ slug: "chatgpt" }, { slug: "claude" }];
  }

  return [{ type: "llm" }, { type: "agentes" }, { type: "regulacao" }];
}
