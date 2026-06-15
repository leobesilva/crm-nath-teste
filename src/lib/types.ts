export type Lead = {
  id: string;
  nome: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  cidade?: string | null;
  estado?: string | null;
  origem?: string | null;
  campanha?: string | null;
  produtoInteresse?: string | null;
  dorPrincipal?: string | null;
  momentoArtistico?: string | null;
  etapaFunil: string;
  statusComercial: string;
  temperatura: string;
  score: number;
  responsavel?: string | null;
  proximaAcao?: string | null;
  dataProximaAcao?: string | null;
  ultimaInteracao?: string | null;
  consentimentoContato: boolean;
  statusFinanceiro: string;
  valorPago: number;
  valorVencido: number;
  valorAVencer: number;
  observacoes?: string | null;
  motivoPerda?: string | null;
  deletadoEm?: string | null;
};

export type Interaction = {
  id: string;
  leadId: string;
  tipo: string;
  descricao: string;
  resultado?: string | null;
  criadoEm: string;
};

export type Task = {
  id: string;
  leadId: string;
  leadNome: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  status: string;
  dataVencimento: string;
  responsavel?: string | null;
  concluidoEm?: string | null;
};

export type RawEntry = {
  id: string;
  fonte: string;
  payloadJson: Record<string, unknown>;
  nomeOriginal?: string | null;
  telefoneOriginal?: string | null;
  emailOriginal?: string | null;
  instagramOriginal?: string | null;
  origemOriginal?: string | null;
  campanhaOriginal?: string | null;
  statusProcessamento: "Pendente" | "Processado" | "Erro" | "Duplicado" | "Ignorado";
  leadId?: string | null;
  erroProcessamento?: string | null;
  criadoEm: string;
};

export type IntegrationSource = {
  id: string;
  nome: string;
  tipo: "WhatsApp" | "Instagram" | "Formulário" | "Página de Vendas" | "Meta Lead Ads" | "Manual" | "Outro";
  status: "Ativa" | "Pausada" | "Erro" | "Rascunho";
  origemPadrao: string;
  campanhaPadrao?: string | null;
  produtoPadrao?: string | null;
  webhookPath: string;
  webhookToken?: string | null;
  provider?: string | null;
  accountName?: string | null;
  externalId?: string | null;
  fieldMapping?: Record<string, string> | null;
  recebidos: number;
  processados: number;
  duplicados: number;
  erros: number;
  ultimaEntrada?: string | null;
};

export type UtmData = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
};

export type Campaign = {
  id: string;
  nome: string;
  origem?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  investimento: number;
  status: "Planejada" | "Ativa" | "Encerrada" | "Pausada";
  observacoes?: string | null;
};

export type Product = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  recorrente: boolean;
  ativo: boolean;
};

export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorRole: string;
  description: string;
  createdAt: string;
};

export type DashboardData = {
  metrics: { label: string; value: string; hint?: string }[];
  funnel: { etapa: string; total: number }[];
  origins: { origem: string; total: number }[];
  temperatures: { temperatura: string; total: number }[];
  revenue: { mes: string; paga: number; vencida: number }[];
  losses: { motivo: string; total: number }[];
  campaigns?: {
    nome: string;
    origem: string;
    investimento: number;
    leads: number;
    vendas: number;
    receita: number;
    cac: string;
    conversao: string;
  }[];
  conversions?: { etapa: string; taxa: string }[];
  productSales?: { produto: string; vendas: number; receita: number }[];
};
