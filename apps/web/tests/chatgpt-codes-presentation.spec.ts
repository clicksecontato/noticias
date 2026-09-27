import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHATGPT_CODES } from "../src/admin/chatgpt-codes";

const root = (...parts: string[]) => resolve(__dirname, ...parts);

describe("códigos do ChatGPT", () => {
  it("tem os 50 códigos da imagem, sem repetir", () => {
    expect(CHATGPT_CODES).toHaveLength(50);
    expect(CHATGPT_CODES.map((item) => item.n)).toEqual(
      Array.from({ length: 50 }, (_, index) => index + 1)
    );
    expect(new Set(CHATGPT_CODES.map((item) => item.code)).size).toBe(50);
    expect(CHATGPT_CODES[0]).toMatchObject({ code: "/rewrite", does: expect.stringMatching(/[Rr]eescrev/) });
    expect(CHATGPT_CODES[25]?.code).toBe("/objections");
    expect(CHATGPT_CODES[49]).toMatchObject({ code: "/imageprompt" });
    for (const item of CHATGPT_CODES) {
      expect(item.code.startsWith("/")).toBe(true);
      expect(item.use.trim().length).toBeGreaterThan(20);
      expect(item.example.input).toContain(item.code);
      expect(item.example.output.trim().length).toBeGreaterThan(15);
    }
  });

  it("abre uma apresentação com uma tela por código", () => {
    const page = readFileSync(root("../app/admin/codigos-chatgpt/page.tsx"), "utf8");
    const client = readFileSync(root("../app/admin/codigos-chatgpt/CodigosChatGptClient.tsx"), "utf8");
    const sidebar = readFileSync(root("../app/admin/components/AdminSidebar.tsx"), "utf8");
    expect(page).toMatch(/CodigosChatGptClient/);
    expect(client).toMatch(/PresentationStage/);
    expect(client).toMatch(/CHATGPT_CODES\.map/);
    expect(client).toMatch(/<Slide/);
    expect(client).toMatch(/example\.input/);
    expect(client).toMatch(/example\.output/);
    expect(sidebar).toMatch(/\/admin\/codigos-chatgpt/);
  });
});
