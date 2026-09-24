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
const sidebar = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminSidebar.tsx"),
  "utf8"
);
const layoutRoot = readFileSync(
  resolve(__dirname, "../app/layout.tsx"),
  "utf8"
);
const adminLayout = readFileSync(
  resolve(__dirname, "../app/admin/components/AdminLayoutClient.tsx"),
  "utf8"
);

describe("admin shell — exemplo-layout-final", () => {
  it("primary UI é gold/bronze do modelo (não azul sky)", () => {
    const darkBlock = globalsCss.match(/\.dark\s*\{([\s\S]*?)\n  \}/)?.[1] ?? "";
    expect(darkBlock).toMatch(/--primary:\s*#d4a574\b/);
    expect(darkBlock).toMatch(/--background:\s*#242625\b/);
    expect(darkBlock).not.toMatch(/--primary:\s*#0ea5e9\b/);
  });

  it("gráficos mantêm contraste warm/cool (gold + verde)", () => {
    expect(globalsCss).toMatch(/--chart-1:\s*#d4a574\b/);
    expect(globalsCss).toMatch(/--chart-2:\s*#00c853\b/);
    expect(chartGradients).toMatch(/warmMid:\s*"#d4a574"/);
    expect(chartGradients).toMatch(/coolMid:\s*"#00c853"/);
  });

  it("botões usam degradê gold sem inset branco forte", () => {
    expect(buttonTsx).toMatch(/#d4a574/);
    expect(buttonTsx).not.toMatch(/#0ea5e9/);
    expect(buttonTsx).toMatch(/overflow-hidden/);
    expect(buttonTsx).not.toMatch(/inset_0_1px_0_rgba\(255,255,255,0\.(3|4|5)/);
  });

  it("sidebar retrátil com Notícias IA e tooltip", () => {
    expect(sidebar).toMatch(/Notícias/);
    expect(sidebar).toMatch(/collapsed|setCollapsed|isCollapsed/);
    expect(sidebar).toMatch(/tooltip|title=|group-hover:opacity/i);
    expect(sidebar).not.toMatch(/>Admin</);
  });

  it("root shell omite nav/footer no admin; layout sem top-16", () => {
    expect(layoutRoot).toMatch(/AppShell|isAdmin/);
    expect(adminLayout).not.toMatch(/top-16/);
  });
});
