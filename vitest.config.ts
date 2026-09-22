import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web")
    }
  },
  test: {
    include: ["packages/**/tests/**/*.spec.ts", "apps/**/tests/**/*.spec.ts"],
    environment: "node"
  }
});
