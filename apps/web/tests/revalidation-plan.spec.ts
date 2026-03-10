import { describe, expect, it } from "vitest";
import { planRevalidationForPublication } from "../src/revalidation-plan";

describe("Web Application Agent - revalidation plan by event", () => {
  it("deve planejar revalidacao para noticia publicada", () => {
    const plan = planRevalidationForPublication({
      entity: "news",
      slug: "novo-trailer-de-gta-6"
    });

    expect(plan.tags).toEqual(
      expect.arrayContaining(["page:news", "news:novo-trailer-de-gta-6"])
    );
    expect(plan.paths).toEqual(["/news/novo-trailer-de-gta-6"]);
  });

  it("deve planejar revalidacao para jogo e derivados", () => {
    const plan = planRevalidationForPublication({
      entity: "game",
      slug: "elden-ring",
      genre: "rpg"
    });

    expect(plan.tags).toEqual(
      expect.arrayContaining(["page:game", "game:elden-ring", "genre:rpg"])
    );
    expect(plan.paths).toEqual(
      expect.arrayContaining(["/games/elden-ring", "/games-like/elden-ring"])
    );
  });
});
