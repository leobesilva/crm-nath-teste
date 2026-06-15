# CRM Estrada do Artista

CRM web para captação, qualificação, acompanhamento comercial, automação de entrada de leads, pipeline e dashboard da mentoria Estrada do Artista.

## Stack

- Next.js com App Router e TypeScript
- Tailwind CSS
- Prisma + Supabase PostgreSQL
- Supabase Auth preparado via variáveis de ambiente
- Recharts para dashboards
- XLSX para importação CSV/XLSX
- Vitest para regras comerciais

## Como rodar localmente

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Abra `http://localhost:3000`.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Copie a string de conexão PostgreSQL para `DATABASE_URL` e `DIRECT_URL`.
3. Copie `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Rode:

```bash
npm run prisma:migrate
npm run prisma:seed
```

O seed cria origens, produtos iniciais e um perfil Admin local.

## Integração Supabase/PostgreSQL

O app funciona em dois modos:

- `Demo em memória`: quando não existe `.env` com `DATABASE_URL`.
- `Banco real`: quando `DATABASE_URL` aponta para o PostgreSQL do Supabase.

A tela `/integracoes` mostra o status atual de Supabase, Prisma e variáveis obrigatórias. Depois de preencher o `.env`, rode:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

As rotas de dashboard, listagem/criação de leads, webhook e exportação já usam o adaptador híbrido: banco real quando configurado, memória quando não configurado.

## Importar planilha

A tela `/importacao` aceita o fluxo previsto para CSV/XLSX. A API `POST /api/import/xlsx` recebe um `multipart/form-data` com o campo `file` e espera colunas como:

- Nome
- CPF/CNPJ
- Email
- Celular
- Cidade/Estado
- Valor pago
- Valor vencido
- Valor a vencer

Durante a normalização, a base antiga entra com origem `Lista Antiga`; leads com valor pago entram em `Reativação`, e o status financeiro é calculado automaticamente.

## Webhook de leads

Endpoint:

```http
POST /api/webhooks/leads
```

Payload:

```json
{
  "nome": "Nome do lead",
  "telefone": "",
  "whatsapp": "",
  "email": "",
  "instagram": "",
  "origem": "Página de Vendas",
  "campanha": "Campanha Junho",
  "dor_principal": "Falta de direção artística",
  "produto_interesse": "Diagnóstico ALIANÇA",
  "consentimento_contato": true,
  "payload_original": {}
}
```

Resposta:

```json
{
  "status": "processado",
  "lead_id": "...",
  "acao_recomendada": "Chamar no WhatsApp em até 24h"
}
```

Na Fase 2, o webhook também registra a entrada em `/entrada-bruta`, processa o lead, sinaliza duplicidade, cria interação de sistema e cria a tarefa inicial com base na próxima ação.

## Integracoes de canais

A tela `/integracoes` cria e lista fontes de leads persistidas no Supabase. Cada fonte recebe um endpoint com token proprio, por exemplo:

```http
POST /api/webhooks/whatsapp?source=source-whatsapp&token=...
POST /api/webhooks/instagram?source=source-instagram&token=...
POST /api/webhooks/forms?source=source-forms&token=...
POST /api/webhooks/meta-leads?source=source-meta-leads&token=...
```

Os endpoints aceitam payloads genericos e normalizam campos comuns de:

- WhatsApp via Evolution API, Z-API, ManyChat ou payload proprio.
- Instagram Direct via automacao externa.
- Formularios e paginas de venda com UTMs.
- Meta Lead Ads com `field_data`.

Campos de campanha sao priorizados nesta ordem: campo direto `campanha`, `campaign`, `utm_campaign` e campanha padrao da fonte. A entrada original sempre fica salva em `lead_raw_entries` antes da criacao do lead.

Para validacao do webhook da Meta, configure `META_WEBHOOK_VERIFY_TOKEN` no ambiente e use:

```http
GET /api/webhooks/meta-leads?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
```

## Fase 2 implementada

- Entrada bruta com ações de processar, reprocessar e ignorar.
- Webhook conectado ao fluxo de entrada bruta, regras, criação de lead, tarefa inicial e histórico.
- Tarefas com criação, conclusão e reabertura pela interface.
- Histórico de interações com registro rápido por lead.
- Automações com simulador de score, temperatura, produto sugerido, próxima ação e status financeiro.
- Mescla de duplicados no perfil do lead, preservando tarefas e interações no lead de destino.

## Fase 3 implementada

- Dashboard avançado calculado a partir do estado do CRM, com receita paga, vencida, a vencer, ticket médio, MRR, CAC, churn, taxa de resposta, conversão por etapa, vendas por produto e performance por campanha.
- Campanhas com criação pela interface e indicadores de leads, qualificados, diagnósticos, vendas, receita, CAC estimado e conversão.
- Exportação CSV/XLSX em `/api/leads/export`, restrita ao perfil Admin via cabeçalho `x-crm-role`.
- Controles LGPD em Configurações para anonimizar lead e excluir logicamente.
- Log de auditoria para exportações, anonimizações e exclusões lógicas.
- Permissões simuladas para Admin, Comercial e Visualização, prontas para conexão com Supabase Auth.

## Regras comerciais

As regras ficam em `src/lib/rules.ts`:

- Normalização de telefone, CPF/CNPJ e e-mail
- Score de 0 a 100
- Temperatura do lead
- Produto sugerido
- Próxima ação
- Status financeiro
- Detecção de duplicidade

Rode os testes:

```bash
npm test
```

## Publicar na Vercel

Antes de publicar, rotacione no Supabase as chaves e senhas que tenham sido compartilhadas fora do painel, principalmente `SUPABASE_SERVICE_ROLE_KEY`, senha do banco e tokens de webhook.

1. Suba este projeto para um repositorio GitHub, GitLab ou Bitbucket.
2. Na Vercel, clique em `Add New Project` e importe o repositorio.
3. Configure o framework como Next.js.
4. Use `npm install` como install command e `npm run build` como build command.
5. Em `Environment Variables`, copie as variaveis do `.env.example`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `META_WEBHOOK_VERIFY_TOKEN`
   - `WEBHOOK_VERIFY_TOKEN`
6. Aplique as migrations no banco de producao antes do primeiro deploy:

```bash
npm run prisma:deploy
npm run prisma:seed
```

7. No Supabase Auth, configure `Site URL` com o dominio final da Vercel e adicione os redirects:
   - `https://seu-dominio.vercel.app/login`
   - `https://seu-dominio.vercel.app/auth/callback`
8. Faca o deploy na Vercel.
9. Depois do deploy, atualize as integracoes externas para apontar para o dominio publico, por exemplo:

```http
POST https://seu-dominio.vercel.app/api/webhooks/leads
POST https://seu-dominio.vercel.app/api/webhooks/whatsapp?source=...&token=...
POST https://seu-dominio.vercel.app/api/webhooks/meta-leads?source=...&token=...
```

Para outras pessoas acessarem, envie o dominio gerado pela Vercel e cadastre os usuarios em `/configuracoes` ou pelo fluxo de primeiro acesso/login, conforme o perfil desejado.

## Observações

A primeira entrega inclui telas e APIs estruturadas com dados demonstrativos para navegação imediata. Com o Supabase configurado, a próxima evolução natural é substituir os mocks das telas pelo Prisma client nas consultas e mutations.
