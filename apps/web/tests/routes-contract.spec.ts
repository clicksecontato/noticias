import { describe, expect, it } from "vitest";
import { buildRoutePath } from "../src/routes";

describe("Web Application Agent - dynamic routes contract", () => {
  it("deve montar rota de noticia por slug", () => {
    expect(buildRoutePath({ type: "news", slug: "openai-lanca-atualizacao-chatgpt" })).toBe(
      "/news/openai-lanca-atualizacao-chatgpt"
    );
  });

  it("deve montar rota de subject por slug", () => {
    expect(buildRoutePath({ type: "subject", slug: "chatgpt" })).toBe(
      "/subjects/chatgpt"
    );
  });

  it("deve montar rota de subjects-like por slug", () => {
    expect(buildRoutePath({ type: "subjects-like", slug: "chatgpt" })).toBe(
      "/subjects-like/chatgpt"
    );
  });

  it("deve montar rota de melhores por tipo", () => {
    expect(
      buildRoutePath({
        type: "best-type",
        typeSlug: "llm"
      })
    ).toBe("/best/llm");
  });

  it("deve falhar quando parametro obrigatorio estiver ausente", () => {
    expect(() => buildRoutePath({ type: "subjects-like" })).toThrow(
      "Missing required route parameter"
    );
  });
});
