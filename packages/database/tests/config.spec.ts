import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "../src/config";

describe("Database Agent - config provider", () => {
  it("deve retornar configuracoes padrao", () => {
    const config = getDatabaseConfig({});

    expect(config.schemaName).toBe("public");
    expect(config.migrationTable).toBe("schema_migrations");
    expect(config.statementTimeoutMs).toBe(30000);
  });

  it("deve permitir override por variaveis de ambiente", () => {
    const config = getDatabaseConfig({
      DB_SCHEMA_NAME: "gaming",
      DB_MIGRATION_TABLE: "db_migrations",
      DB_STATEMENT_TIMEOUT_MS: "45000"
    });

    expect(config.schemaName).toBe("gaming");
    expect(config.migrationTable).toBe("db_migrations");
    expect(config.statementTimeoutMs).toBe(45000);
  });

  it("deve expor configuracao de source e supabase", () => {
    const config = getDatabaseConfig({
      DB_CONTENT_SOURCE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-key"
    });

    expect(config.contentSource).toBe("supabase");
    expect(config.supabaseUrl).toBe("https://example.supabase.co");
    expect(config.supabaseAnonKey).toBe("anon-key");
  });
});
