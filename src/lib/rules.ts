import { z } from "zod";

export const leadRuleInputSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().nullish(),
  telefone: z.string().nullish(),
  whatsapp: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal("")),
  instagram: z.string().nullish(),
  origem: z.string().nullish(),
  campanha: z.string().nullish(),
  dorPrincipal: z.string().nullish(),
  produtoInteresse: z.string().nullish(),
  etapaFunil: z.string().nullish(),
  consentimentoContato: z.boolean().optional().default(false),
  statusFinanceiro: z.string().nullish(),
  valorPago: z.number().optional().default(0),
  valorVencido: z.number().optional().default(0),
  valorAVencer: z.number().optional().default(0),
  respondeuContato: z.boolean().optional().default(false),
  pediuPrecoOuDiagnostico: z.boolean().optional().default(false),
  clienteAntigo: z.boolean().optional().default(false),
});

export type LeadRuleInput = z.infer<typeof leadRuleInputSchema>;

export function normalizePhone(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function normalizeCpfCnpj(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits || null;
}

export function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

export function calculateFinancialStatus(input: Pick<LeadRuleInput, "valorPago" | "valorVencido" | "valorAVencer">) {
  if ((input.valorVencido ?? 0) > 0) return "Inadimplente";
  if ((input.valorPago ?? 0) > 0) return "Cliente/Comprador anterior";
  if ((input.valorAVencer ?? 0) > 0) return "A vencer";
  return "Sem informação";
}

export function calculateScore(input: LeadRuleInput) {
  let score = 0;
  if (input.whatsapp || input.telefone) score += 15;
  if (input.email) score += 10;
  if (input.instagram) score += 10;
  if (input.consentimentoContato) score += 10;
  if (input.dorPrincipal) score += 15;
  if (input.produtoInteresse) score += 15;
  if (input.origem) score += 10;
  if (input.respondeuContato) score += 15;
  if (input.pediuPrecoOuDiagnostico) score += 25;
  if (input.clienteAntigo || (input.valorPago ?? 0) > 0) score += 20;
  return Math.min(score, 100);
}

export function temperatureFromScore(score: number) {
  if (score >= 80) return "Muito quente";
  if (score >= 60) return "Quente";
  if (score >= 30) return "Morno";
  return "Frio";
}

export function calculateTemperature(input: LeadRuleInput, score = calculateScore(input)) {
  if (input.pediuPrecoOuDiagnostico) return "Muito quente";
  if (input.respondeuContato) return "Quente";
  if ((input.valorPago ?? 0) > 0 || input.clienteAntigo) return "Quente";
  if (input.origem && input.origem !== "Lista Antiga") return temperatureFromScore(score);
  return temperatureFromScore(score);
}

export function suggestProduct(input: LeadRuleInput) {
  const dor = input.dorPrincipal;
  if (input.pediuPrecoOuDiagnostico && input.produtoInteresse?.toLowerCase().includes("individual")) {
    return "Premium / Tempo de Mesa";
  }
  if (dor === "Quer lançar projeto") return "Direção Vocal/Artística para Projeto";
  if (dor === "Quer reposicionamento") return "Diagnóstico ALIANÇA";
  if (dor === "Repertório confuso" || dor === "Insegurança vocal" || dor === "Precisa de acompanhamento") {
    return "Estrada do Artista";
  }
  if (dor === "Conteúdo sem estratégia") return "Estrada do Artista";
  if (dor === "Falta de direção artística" || dor === "Carreira travada") return "Diagnóstico ALIANÇA";
  return input.produtoInteresse || "Diagnóstico ALIANÇA";
}

export function suggestNextAction(input: LeadRuleInput, temperature = calculateTemperature(input)) {
  if ((input.valorVencido ?? 0) > 0) return "Regularizar financeiro";
  if (input.etapaFunil === "Diagnóstico Agendado") return "Confirmar presença";
  if (input.etapaFunil === "Diagnóstico Realizado") return "Follow-up de proposta";
  if ((input.valorPago ?? 0) > 0 || input.clienteAntigo) return "Reativação com convite personalizado";
  if (temperature === "Muito quente") return "Agendar diagnóstico ou enviar proposta";
  if (temperature === "Quente") return "Ofertar Diagnóstico ALIANÇA";
  if (input.whatsapp || input.telefone) return "Chamar no WhatsApp em até 24h";
  if (input.email) return "Enviar e-mail de nutrição";
  return "Nutrição / reativação futura";
}

export type DuplicateCandidate = {
  id: string;
  nome: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cidade?: string | null;
};

export function detectDuplicate<T extends DuplicateCandidate>(input: DuplicateCandidate, existing: T[]) {
  const cpf = normalizeCpfCnpj(input.cpfCnpj);
  const phone = normalizePhone(input.whatsapp || input.telefone);
  const email = normalizeEmail(input.email);

  return existing
    .map((lead) => {
      if (cpf && normalizeCpfCnpj(lead.cpfCnpj) === cpf) return { lead, strength: "forte", reason: "CPF/CNPJ igual" };
      const otherPhone = normalizePhone(lead.whatsapp || lead.telefone);
      if (phone && otherPhone === phone) return { lead, strength: "forte", reason: "Telefone/WhatsApp igual" };
      if (email && normalizeEmail(lead.email) === email) return { lead, strength: "médio", reason: "E-mail igual" };
      const sameCity = input.cidade && lead.cidade && input.cidade.toLowerCase() === lead.cidade.toLowerCase();
      const similarName = input.nome && lead.nome && lead.nome.toLowerCase().includes(input.nome.toLowerCase().slice(0, 5));
      if (!phone && sameCity && similarName) return { lead, strength: "possível", reason: "Nome parecido e cidade igual" };
      return null;
    })
    .filter(Boolean);
}

export function applyLeadRules(raw: Partial<LeadRuleInput>) {
  const input = leadRuleInputSchema.parse({
    ...raw,
    cpfCnpj: normalizeCpfCnpj(raw.cpfCnpj),
    telefone: normalizePhone(raw.telefone),
    whatsapp: normalizePhone(raw.whatsapp),
    email: normalizeEmail(raw.email),
    valorPago: Number(raw.valorPago ?? 0),
    valorVencido: Number(raw.valorVencido ?? 0),
    valorAVencer: Number(raw.valorAVencer ?? 0),
  });
  const score = calculateScore(input);
  const temperatura = calculateTemperature(input, score);
  return {
    ...input,
    score,
    temperatura,
    produtoSugerido: suggestProduct(input),
    proximaAcao: suggestNextAction(input, temperatura),
    statusFinanceiro: calculateFinancialStatus(input),
  };
}
