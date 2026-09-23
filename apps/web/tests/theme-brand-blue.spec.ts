import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(__dirname, "../app/globals.css"),
  "utf8"
);
const buttonTsx = readFileSync(
  resolve(__dirname, "../components/ui/button.tsx"),
  "utf8"
);
const chartGradients = readFileSync(
  resolve(__dirname, "../src/ui/chart-gradients.tsx"),
  "utf8"
);

describe("brand blue UI + orange/green charts", () => {
  it("primary/ring UI são azul sky (não laranja)", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(darkBlock).toMatch(/--primary:\s*#0ea5e9\b/);
    expect(darkBlock).toMatch(/--ring:\s*#0ea5e9\b/);
    expect(darkBlock).not.toMatch(/--primary:\s*#ff6a00\b/);
  });

  it("gráficos mantêm laranja e verde", () => {
    expect(globalsCss).toMatch(/--chart-1:\s*#ff6a00\b/);
    expect(globalsCss).toMatch(/--chart-2:\s*#00c853\b/);
    expect(chartGradients).toMatch(/warmMid:\s*"#ff6a00"/);
    expect(chartGradients).toMatch(/coolMid:\s*"#00c853"/);
  });

  it("logo/accent/progress usam degradê de marca azul", () => {
    expect(globalsCss).toMatch(
      /--grad-brand:\s*[^;]*#38bdf8[^;]*#0ea5e9[^;]*#0284c7/
    );
    expect(globalsCss).toMatch(
      /\.gradient-text\s*\{[\s\S]*?var\(--grad-brand\)/
    );
    expect(globalsCss).toMatch(/\.accent-bar[\s\S]*?var\(--grad-brand\)/);
    expect(globalsCss).toMatch(/\.progress-neo\s*>\s*span[\s\S]*?var\(--grad-brand\)/);
  });

  it("botão default azul sem highlight inset branco forte na borda", () => {
    expect(buttonTsx).toMatch(/#0ea5e9/);
    expect(buttonTsx).not.toMatch(/#ff6a00/);
    expect(buttonTsx).toMatch(/overflow-hidden/);
    expect(buttonTsx).not.toMatch(/inset_0_1px_0_rgba\(255,255,255,0\.(3|4|5)/);
  });
});
