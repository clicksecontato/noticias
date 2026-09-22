import { describe, expect, it } from "vitest";
import { planRevalidationForPublication } from "../src/revalidation-plan";

describe("Web Application Agent - revalidation plan by event", () => {
  it("deve planejar revalidacao para noticia publicada", () => {
    const plan = planRevalidationForPublication({
      entity: "news",
      slug: "openai-lanca-atualizacao-chatgpt"
    });

    expect(plan.tags).toEqual(
      expect.arrayContaining(["page:news", "news:openai-lanca-atualizacao-chatgpt"])
    );
    expect(plan.paths).toEqual(["/news/openai-lanca-atualizacao-chatgpt"]);
  });

  it("deve planejar revalidacao para assunto e derivados", () => {
    const plan = planRevalidationForPublication({
      entity: "subject",
      slug: "chatgpt",
      type: "llm"
    });

    expect(plan.tags).toEqual(
      expect.arrayContaining(["page:subject", "subject:chatgpt", "type:llm"])
    );
    expect(plan.paths).toEqual(
      expect.arrayContaining(["/subjects/chatgpt", "/subjects-like/chatgpt"])
    );
  });
});
