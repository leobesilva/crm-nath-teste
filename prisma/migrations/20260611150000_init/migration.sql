CREATE TABLE "profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'Comercial',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "origins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL UNIQUE,
  "ativo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "products" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL UNIQUE,
  "categoria" TEXT NOT NULL,
  "preco" NUMERIC(12,2),
  "recorrente" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "campaigns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "origem_id" UUID REFERENCES "origins"("id"),
  "data_inicio" DATE,
  "data_fim" DATE,
  "investimento" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'Planejada',
  "observacoes" TEXT
);

CREATE TABLE "leads" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "cpf_cnpj" TEXT,
  "telefone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "instagram" TEXT,
  "cidade" TEXT,
  "estado" TEXT,
  "origem_id" UUID REFERENCES "origins"("id"),
  "campanha_id" UUID REFERENCES "campaigns"("id"),
  "produto_interesse_id" UUID REFERENCES "products"("id"),
  "dor_principal" TEXT,
  "momento_artistico" TEXT,
  "etapa_funil" TEXT NOT NULL DEFAULT 'Novo Lead',
  "status_comercial" TEXT NOT NULL DEFAULT 'Novo Lead',
  "temperatura" TEXT NOT NULL DEFAULT 'Frio',
  "score" INTEGER NOT NULL DEFAULT 0,
  "responsavel_id" UUID REFERENCES "profiles"("id"),
  "proxima_acao" TEXT,
  "data_proxima_acao" TIMESTAMP,
  "ultima_interacao" TIMESTAMP,
  "consentimento_contato" BOOLEAN NOT NULL DEFAULT false,
  "data_consentimento" TIMESTAMP,
  "origem_consentimento" TEXT,
  "status_financeiro" TEXT NOT NULL DEFAULT 'Sem informação',
  "valor_pago" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "valor_vencido" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "valor_a_vencer" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "observacoes" TEXT,
  "motivo_perda" TEXT,
  "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
  "deletado_em" TIMESTAMP
);

CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE INDEX "leads_cpf_cnpj_idx" ON "leads"("cpf_cnpj");
CREATE INDEX "leads_whatsapp_idx" ON "leads"("whatsapp");

CREATE TABLE "lead_raw_entries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fonte" TEXT NOT NULL,
  "payload_json" JSONB NOT NULL,
  "nome_original" TEXT,
  "telefone_original" TEXT,
  "email_original" TEXT,
  "instagram_original" TEXT,
  "origem_original" TEXT,
  "campanha_original" TEXT,
  "status_processamento" TEXT NOT NULL DEFAULT 'Pendente',
  "lead_id" UUID REFERENCES "leads"("id"),
  "erro_processamento" TEXT,
  "criado_em" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "interactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" UUID NOT NULL REFERENCES "leads"("id"),
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "resultado" TEXT,
  "criado_por" UUID,
  "criado_em" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" UUID NOT NULL REFERENCES "leads"("id"),
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pendente',
  "data_vencimento" TIMESTAMP NOT NULL,
  "responsavel_id" UUID REFERENCES "profiles"("id"),
  "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
  "concluido_em" TIMESTAMP
);

CREATE TABLE "sales_opportunities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" UUID NOT NULL REFERENCES "leads"("id"),
  "produto_id" UUID NOT NULL REFERENCES "products"("id"),
  "valor_proposto" NUMERIC(12,2),
  "etapa" TEXT NOT NULL DEFAULT 'Interesse',
  "probabilidade" INTEGER,
  "data_abertura" TIMESTAMP NOT NULL DEFAULT now(),
  "data_fechamento" TIMESTAMP,
  "motivo_perda" TEXT,
  "observacoes" TEXT
);
