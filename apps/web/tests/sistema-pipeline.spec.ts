import { describe, expect, it } from "vitest";
import { PIPELINE_STEP_TITLES } from "../src/sistema/pipeline-copy";

describe("sistema pipeline copy", () => {
  it("mantém as 5 etapas da narrativa pública", () => {
    expect(PIPELINE_STEP_TITLES).toEqual([
      "Fontes",
      "Ingestão",
      "Filtro editorial",
      "Enriquecimento",
      "Pauta & machine",
    ]);
  });
});
