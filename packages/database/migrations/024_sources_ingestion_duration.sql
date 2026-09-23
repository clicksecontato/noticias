-- Duração da última ingestão por fonte (comparação de canais / stacks).
ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS last_ingested_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_ingestion_duration_ms INTEGER NULL;

COMMENT ON COLUMN sources.last_ingested_at IS 'Fim da última tentativa de ingestão (sucesso ou falha).';
COMMENT ON COLUMN sources.last_ingestion_duration_ms IS 'Wall-clock da última ingestão em milissegundos (fetch + persist).';
