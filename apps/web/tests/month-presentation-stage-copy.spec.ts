import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const client = readFileSync(
  resolve(__dirname, "../app/admin/month-presentation/MonthPresentationClient.tsx"),
  "utf8"
);
const generator = readFileSync(
  resolve(__dirname, "../src/reports/generators/month-presentation.ts"),
  "utf8"
);

describe("apresentação mensal para quem assiste", () => {
  it("não exibe gráficos irrelevantes para o vídeo", () => {
    expect(client).not.toMatch(/Slide title="Mix de fontes"/);
    expect(client).not.toMatch(/Slide title="Participação no mês"/);
    expect(client).not.toMatch(/Slide title="Qualidade de vínculos"/);
    expect(client).not.toMatch(/Slide title="Cadência RSS x YouTube"/);
  });

  it("separa o gráfico de cadência por criador da tabela de fontes", () => {
    expect(client).toMatch(/Slide title="Publicações por dia da semana"/);
    expect(client).toMatch(/Slide title="Fontes no período"/);
    const chartAt = client.indexOf('Slide title="Publicações por dia da semana"');
    const tableAt = client.indexOf('Slide title="Fontes no período"');
    expect(chartAt).toBeGreaterThan(-1);
    expect(tableAt).toBeGreaterThan(chartAt);
    const tableSlide = client.slice(tableAt, client.indexOf('Slide title="Roteiro sugerido"'));
    expect(tableSlide).toMatch(/theme-scrollbar/);
  });

  it("chama as marcações de classificações", () => {
    expect(client).toMatch(/Classificações/);
    expect(client).not.toMatch(/Vínculos/);
    expect(client).not.toMatch(/vínculos/);
    expect(generator).toMatch(/classificações/);
    expect(generator).not.toMatch(/vínculos/);
  });
});
