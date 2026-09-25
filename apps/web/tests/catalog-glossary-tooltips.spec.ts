import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const glossary = readFileSync(
  resolve(__dirname, "../src/admin/catalog-glossary.ts"),
  "utf8"
);
const title = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminPageTitle.tsx"),
  "utf8"
);
const assuntos = readFileSync(
  resolve(__dirname, "../app/admin/assuntos/AssuntosClient.tsx"),
  "utf8"
);
const tipos = readFileSync(
  resolve(__dirname, "../app/admin/tipos/TiposClient.tsx"),
  "utf8"
);
const tags = readFileSync(
  resolve(__dirname, "../app/admin/tags/TagsClient.tsx"),
  "utf8"
);

describe("catalog glossary tooltips", () => {
  it("glossário usa dois-pontos (não travessão) após Assunto/Tipo/Tag", () => {
    expect(glossary).toMatch(/Assunto:/);
    expect(glossary).toMatch(/Tipo:/);
    expect(glossary).toMatch(/Tag:/);
    expect(glossary).not.toMatch(/Assunto —/);
    expect(glossary).not.toMatch(/Tipo —/);
    expect(glossary).not.toMatch(/Tag —/);
  });

  it("AdminPageTitle aceita hint e páginas do catálogo passam o glossário", () => {
    expect(title).toMatch(/hint\?/);
    expect(assuntos).toMatch(/CATALOG_GLOSSARY\.subject/);
    expect(tipos).toMatch(/CATALOG_GLOSSARY\.type/);
    expect(tags).toMatch(/CATALOG_GLOSSARY\.tag/);
  });
});
