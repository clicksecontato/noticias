import { describe, expect, it } from "vitest";
import { buildMetadata } from "../src/metadata";

describe("SEO Agent - metadata generation", () => {
  it("deve gerar title e description para pagina de assunto", () => {
    const metadata = buildMetadata({
      pageType: "subject",
      entityName: "ChatGPT"
    });

    expect(metadata.title).toContain("ChatGPT");
    expect(metadata.title.length).toBeLessThanOrEqual(60);
    expect(metadata.description.length).toBeGreaterThanOrEqual(120);
    expect(metadata.description.length).toBeLessThanOrEqual(160);
  });

  it("deve gerar metadata orientada a intencao para pagina de tipo", () => {
    const metadata = buildMetadata({
      pageType: "type",
      entityName: "LLM"
    });

    expect(metadata.title.toLowerCase()).toContain("llm");
    expect(metadata.description.toLowerCase()).toContain("llm");
  });
});
