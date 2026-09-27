import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { activeYoutubeChannelUrls } from "../src/admin/youtube-channel-urls";

const root = (...parts: string[]) => resolve(__dirname, ...parts);

describe("urls dos canais YouTube ativos", () => {
  it("junta uma url @ por linha e ignora canal que só tem id UC", () => {
    const text = activeYoutubeChannelUrls([
      {
        name: "Zeta",
        provider: "youtube",
        isActive: true,
        channelId: "UCzzzzzzzzzzzzzzzzzzzz",
        handle: "@ZetaCanal",
      },
      { name: "Inativo", provider: "youtube", isActive: false, channelId: "UCaaaaaaaaaaaaaaaaaaaa", handle: "Inativo" },
      { name: "Feed", provider: "rss", isActive: true, channelId: "UCbbbbbbbbbbbbbbbbbbbb", handle: "Feed" },
      { name: "Alfa", provider: "youtube", isActive: true, channelId: "https://www.youtube.com/@alfa/videos" },
      { name: "Só id", provider: "youtube", isActive: true, channelId: "UCcccccccccccccccccccc" },
      { name: "Sem id", provider: "youtube", isActive: true, channelId: "  " },
    ]);

    expect(text).toBe(
      ["https://www.youtube.com/@alfa", "https://www.youtube.com/@ZetaCanal"].join("\n")
    );
    expect(text).not.toMatch(/\/channel\//);
  });

  it("a página deixa copiar o bloco inteiro", () => {
    const page = readFileSync(root("../app/admin/canais-youtube/page.tsx"), "utf8");
    const client = readFileSync(root("../app/admin/canais-youtube/CanaisYoutubeUrlsClient.tsx"), "utf8");
    const sidebar = readFileSync(root("../app/admin/components/AdminSidebar.tsx"), "utf8");
    const urls = readFileSync(root("../src/admin/youtube-channel-urls.ts"), "utf8");
    const route = readFileSync(root("../app/api/admin/youtube-channel-urls/route.ts"), "utf8");
    expect(page).toMatch(/CanaisYoutubeUrlsClient/);
    expect(route).toMatch(/activeYoutubeChannelUrls/);
    expect(route).toMatch(/fetchYoutubeHandleByChannelId/);
    expect(urls).toMatch(/customUrl/);
    expect(client).toMatch(/navigator\.clipboard\.writeText/);
    expect(client).toMatch(/textarea/i);
    expect(sidebar).toMatch(/\/admin\/canais-youtube/);
  });
});
