CREATE TABLE IF NOT EXISTS "integration_sources" (
  "id" TEXT PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Rascunho',
  "origem_padrao" TEXT NOT NULL,
  "campanha_padrao" TEXT,
  "produto_padrao" TEXT,
  "webhook_path" TEXT NOT NULL,
  "webhook_token" TEXT UNIQUE,
  "provider" TEXT,
  "account_name" TEXT,
  "external_id" TEXT,
  "field_mapping" JSONB,
  "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "integration_sources_tipo_idx" ON "integration_sources"("tipo");
CREATE INDEX IF NOT EXISTS "integration_sources_status_idx" ON "integration_sources"("status");
