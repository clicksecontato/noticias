export interface DatabaseConfig {
  schemaName: string;
  migrationTable: string;
  statementTimeoutMs: number;
  contentSource: "memory" | "supabase";
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const DEFAULT_SCHEMA_NAME = "public";
const DEFAULT_MIGRATION_TABLE = "schema_migrations";
const DEFAULT_STATEMENT_TIMEOUT_MS = 30000;
const DEFAULT_CONTENT_SOURCE = "memory";

export function getDatabaseConfig(
  env: Record<string, string | undefined> = process.env
): DatabaseConfig {
  const parsedTimeout = Number.parseInt(env.DB_STATEMENT_TIMEOUT_MS || "", 10);
  const statementTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : DEFAULT_STATEMENT_TIMEOUT_MS;

  return {
    schemaName: env.DB_SCHEMA_NAME?.trim() || DEFAULT_SCHEMA_NAME,
    migrationTable: env.DB_MIGRATION_TABLE?.trim() || DEFAULT_MIGRATION_TABLE,
    statementTimeoutMs,
    contentSource:
      env.DB_CONTENT_SOURCE === "supabase" ? "supabase" : DEFAULT_CONTENT_SOURCE,
    supabaseUrl: env.SUPABASE_URL?.trim(),
    supabaseAnonKey: env.SUPABASE_ANON_KEY?.trim()
  };
}
