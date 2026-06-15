import { LeadsTable } from "@/components/leads-table";
import { PageHeader } from "@/components/page-header";
import { getLeads } from "@/lib/db-adapter";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Leads / CRM"
        description="Base comercial com busca, filtros, temperatura, score e próxima ação recomendada."
        actions={[{ label: "Novo Lead", href: "/leads/novo" }, { label: "Importar CSV/XLSX", href: "/importacao" }]}
      />
      <LeadsTable leads={await getLeads()} />
    </>
  );
}
