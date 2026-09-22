import { describe, expect, it } from "vitest";
import { maxFilesizeForYtDlp } from "../src/youtube-shorts/youtube-media-downloader";

describe("maxFilesizeForYtDlp", () => {
  it("retorna 500M para limite alto", () => {
    expect(maxFilesizeForYtDlp(500 * 1024 * 1024)).toBe("500M");
  });

  it("retorna fallback para valor inválido", () => {
    expect(maxFilesizeForYtDlp(0)).toBe("500M");
    expect(maxFilesizeForYtDlp(-1)).toBe("500M");
  });
});
