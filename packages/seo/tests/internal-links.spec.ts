import { describe, expect, it } from "vitest";
import { suggestInternalLinks } from "../src/internal-links";

describe("SEO Agent - internal linking strategy", () => {
  it("deve priorizar links com genero em comum", () => {
    const origin = {
      slugPath: "/games/elden-ring",
      pageType: "game" as const,
      genres: ["rpg", "soulslike"],
      platforms: ["pc", "ps5"],
      tags: ["open-world"]
    };

    const links = suggestInternalLinks(origin, [
      {
        slugPath: "/games/dark-souls-3",
        pageType: "game",
        genres: ["soulslike", "rpg"],
        platforms: ["pc"],
        tags: ["difficult"]
      },
      {
        slugPath: "/games/fifa-26",
        pageType: "game",
        genres: ["sports"],
        platforms: ["pc"],
        tags: ["football"]
      }
    ]);

    expect(links[0]?.to).toBe("/games/dark-souls-3");
    expect(links[0]?.reason).toBe("shared_genre");
  });

  it("deve respeitar limite maximo de links", () => {
    const origin = {
      slugPath: "/best/rpg",
      pageType: "collection" as const,
      genres: ["rpg"],
      platforms: ["pc"]
    };

    const candidates = Array.from({ length: 10 }, (_, index) => ({
      slugPath: `/games/game-${index + 1}`,
      pageType: "game" as const,
      genres: ["rpg"],
      platforms: ["pc"]
    }));

    const links = suggestInternalLinks(origin, candidates, 4);

    expect(links).toHaveLength(4);
  });
});
