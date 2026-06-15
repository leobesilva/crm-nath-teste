import * as XLSX from "xlsx";
import { ok } from "@/lib/api";
import { getLeads } from "@/lib/db-adapter";
import { audit, can } from "@/lib/store";

const columns = [
  "nome",
  "cpfCnpj",
  "telefone",
  "whatsapp",
  "email",
  "instagram",
  "cidade",
  "estado",
  "origem",
  "campanha",
  "produtoInteresse",
  "dorPrincipal",
  "etapaFunil",
  "temperatura",
  "score",
  "proximaAcao",
  "statusFinanceiro",
  "valorPago",
  "valorVencido",
  "valorAVencer",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const role = request.headers.get("x-crm-role") ?? "Admin";

  if (!can(role, "export")) {
    return ok({ error: "Exportação completa permitida somente para Admin." }, 403);
  }

  const rows = (await getLeads())
    .filter((lead) => !lead.deletadoEm)
    .map((lead) => Object.fromEntries(columns.map((column) => [column, lead[column as keyof typeof lead] ?? ""])));

  audit(role, "EXPORT_LEADS", "lead", "all", `Exportação de ${rows.length} leads em ${format.toUpperCase()}.`);

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Leads");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=leads-estrada-do-artista.xlsx",
      },
    });
  }

  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads-estrada-do-artista.csv",
    },
  });
}
