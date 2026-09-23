import { describe, expect, it } from "vitest";
import {
  buildDeleteConfirmCopy,
  truncateDialogLabel,
} from "../src/ui/confirm-dialog";

describe("truncateDialogLabel", () => {
  it("mantém texto curto intacto", () => {
    expect(truncateDialogLabel("Fonte IA", 50)).toBe("Fonte IA");
  });

  it("trunca com reticências quando passa do limite", () => {
    const long = "a".repeat(60);
    expect(truncateDialogLabel(long, 50)).toBe(`${"a".repeat(50)}…`);
  });
});

describe("buildDeleteConfirmCopy", () => {
  it("monta título e descrição para exclusão de fonte", () => {
    const copy = buildDeleteConfirmCopy({
      entity: "fonte",
      name: "Tecnoblog",
      consequence: "Artigos e vídeos vinculados podem ser afetados.",
    });
    expect(copy.title).toBe("Excluir fonte?");
    expect(copy.description).toContain("Tecnoblog");
    expect(copy.description).toContain("Artigos e vídeos");
    expect(copy.confirmLabel).toBe("Excluir");
  });

  it("trunca nomes longos na descrição", () => {
    const copy = buildDeleteConfirmCopy({
      entity: "notícia",
      name: "x".repeat(80),
      maxNameLength: 50,
    });
    expect(copy.description).toContain("…");
    expect(copy.description.length).toBeLessThan(200);
  });
});
