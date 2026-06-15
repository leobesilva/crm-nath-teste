import { describe, expect, it } from "vitest";
import { applyLeadRules, calculateFinancialStatus, detectDuplicate, normalizeCpfCnpj, normalizePhone } from "./rules";

describe("regras comerciais", () => {
  it("normaliza telefone brasileiro e cpf/cnpj", () => {
    expect(normalizePhone("(65) 99999-1111")).toBe("5565999991111");
    expect(normalizeCpfCnpj("123.456.789-00")).toBe("12345678900");
  });

  it("calcula score, temperatura e próxima ação para lead muito quente", () => {
    const lead = applyLeadRules({
      nome: "Ana",
      whatsapp: "(65) 99999-1111",
      email: "ANA@EXAMPLE.COM",
      instagram: "@ana",
      origem: "Instagram Orgânico",
      dorPrincipal: "Falta de direção artística",
      consentimentoContato: true,
      pediuPrecoOuDiagnostico: true,
    });

    expect(lead.score).toBe(95);
    expect(lead.temperatura).toBe("Muito quente");
    expect(lead.produtoSugerido).toBe("Diagnóstico ALIANÇA");
    expect(lead.proximaAcao).toBe("Agendar diagnóstico ou enviar proposta");
  });

  it("classifica status financeiro da base antiga", () => {
    expect(calculateFinancialStatus({ valorPago: 0, valorVencido: 50, valorAVencer: 0 })).toBe("Inadimplente");
    expect(calculateFinancialStatus({ valorPago: 100, valorVencido: 0, valorAVencer: 0 })).toBe("Cliente/Comprador anterior");
    expect(calculateFinancialStatus({ valorPago: 0, valorVencido: 0, valorAVencer: 100 })).toBe("A vencer");
  });

  it("sinaliza duplicidade forte por telefone", () => {
    const duplicates = detectDuplicate(
      { id: "novo", nome: "Ana", whatsapp: "(65) 99999-1111" },
      [{ id: "1", nome: "Ana Clara", whatsapp: "5565999991111" }],
    );

    expect(duplicates[0]?.strength).toBe("forte");
    expect(duplicates[0]?.reason).toBe("Telefone/WhatsApp igual");
  });
});
