import * as XLSX from "xlsx";
import { handleApiError, ok, parseMoney } from "@/lib/api";
import { mockLeads } from "@/lib/mock-data";
import { applyLeadRules, detectDuplicate } from "@/lib/rules";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return ok({ error: "Envie um arquivo CSV ou XLSX no campo file." }, 422);
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    const preview = rows.slice(0, 20).map((row) => {
      const normalized = applyLeadRules({
        nome: String(row.Nome || row.nome || ""),
        cpfCnpj: String(row["CPF/CNPJ"] || row.cpf_cnpj || ""),
        email: String(row.Email || row.email || ""),
        whatsapp: String(row.Celular || row.whatsapp || row.telefone || ""),
        origem: "Lista Antiga",
        etapaFunil: parseMoney(row["Valor pago"]) > 0 ? "Reativação" : "Novo Lead",
        valorPago: parseMoney(row["Valor pago"]),
        valorVencido: parseMoney(row["Valor vencido"]),
        valorAVencer: parseMoney(row["Valor a vencer"]),
        clienteAntigo: parseMoney(row["Valor pago"]) > 0,
      });
      return { row, normalized, duplicates: detectDuplicate({ ...normalized, id: "import" }, mockLeads) };
    });
    return ok({
      registros_lidos: rows.length,
      preview,
      resumo: {
        novos_leads: preview.filter((item) => item.duplicates.length === 0).length,
        duplicados: preview.filter((item) => item.duplicates.length > 0).length,
        erros: preview.filter((item) => !item.normalized.nome).length,
        leads_atualizados: 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
