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

describe("brand gold UI + charts", () => {
  it("primary/ring UI são gold do modelo final", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(darkBlock).toMatch(/--primary:\s*#d4a574\b/);
    expect(darkBlock).toMatch(/--ring:\s*#d4a574\b/);
    expect(darkBlock).not.toMatch(/--primary:\s*#0ea5e9\b/);
  });

  it("gráficos usam gold + verde", () => {
    expect(globalsCss).toMatch(/--chart-1:\s*#d4a574\b/);
    expect(globalsCss).toMatch(/--chart-2:\s*#00c853\b/);
    expect(chartGradients).toMatch(/warmMid:\s*"#d4a574"/);
    expect(chartGradients).toMatch(/coolMid:\s*"#00c853"/);
  });

  it("logo/accent/progress usam degradê de marca gold", () => {
    expect(globalsCss).toMatch(
      /--grad-brand:\s*[^;]*#e8c49a[^;]*#d4a574[^;]*#a67c52/
    );
    expect(globalsCss).toMatch(
      /\.gradient-text\s*\{[\s\S]*?var\(--grad-brand\)/
    );
    expect(globalsCss).toMatch(/\.accent-bar[\s\S]*?var\(--grad-brand\)/);
    expect(globalsCss).toMatch(
      /\.progress-neo\s*>\s*span[\s\S]*?var\(--grad-brand\)/
    );
  });

  it("botão default gold sem highlight inset branco forte", () => {
    expect(buttonTsx).toMatch(/#d4a574/);
    expect(buttonTsx).not.toMatch(/#0ea5e9/);
    expect(buttonTsx).toMatch(/overflow-hidden/);
    expect(buttonTsx).not.toMatch(
      /inset_0_1px_0_rgba\(255,255,255,0\.(3|4|5)/
    );
  });
});
