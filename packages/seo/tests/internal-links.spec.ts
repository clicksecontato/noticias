import { describe, expect, it } from "vitest";
import { suggestInternalLinks } from "../src/internal-links";

describe("SEO Agent - internal linking strategy", () => {
  it("deve priorizar links com tipo em comum", () => {
    const origin = {
      slugPath: "/subjects/chatgpt",
      pageType: "subject" as const,
      types: ["llm", "agentes"],
      tags: ["open-world"]
    };

    const links = suggestInternalLinks(origin, [
      {
        slugPath: "/subjects/dark-souls-3",
        pageType: "subject",
        types: ["agentes", "llm"],
        tags: ["difficult"]
      },
      {
        slugPath: "/subjects/fifa-26",
        pageType: "subject",
        types: ["sports"],
        tags: ["football"]
      }
    ]);

    expect(links[0]?.to).toBe("/subjects/dark-souls-3");
    expect(links[0]?.reason).toBe("shared_type");
  });

  it("deve respeitar limite maximo de links", () => {
    const origin = {
      slugPath: "/best/llm",
      pageType: "collection" as const,
      types: ["llm"]
    };

    const candidates = Array.from({ length: 10 }, (_, index) => ({
      slugPath: `/subjects/subject-${index + 1}`,
      pageType: "subject" as const,
      types: ["llm"]
    }));

    const links = suggestInternalLinks(origin, candidates, 4);

    expect(links).toHaveLength(4);
  });
});
