import { describe, expect, it } from "vitest";
import { buildRoutePath } from "../src/routes";

describe("Web Application Agent - dynamic routes contract", () => {
  it("deve montar rota de noticia por slug", () => {
    expect(buildRoutePath({ type: "news", slug: "novo-trailer-de-gta-6" })).toBe(
      "/news/novo-trailer-de-gta-6"
    );
  });

  it("deve montar rota de game por slug", () => {
    expect(buildRoutePath({ type: "game", slug: "elden-ring" })).toBe(
      "/games/elden-ring"
    );
  });

  it("deve montar rota de melhores por genero e plataforma", () => {
    expect(
      buildRoutePath({
        type: "best-genre-platform",
        genre: "rpg",
        platform: "pc"
      })
    ).toBe("/best/rpg/pc");
  });

  it("deve falhar quando parametro obrigatorio estiver ausente", () => {
    expect(() => buildRoutePath({ type: "games-like" })).toThrow(
      "Missing required route parameter"
    );
  });
});
