import { DashboardClient } from "@/components/dashboard-client";
import { PageHeader } from "@/components/page-header";
import { getDashboard } from "@/lib/db-adapter";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo executivo de captação, funil, campanhas e receita da Estrada do Artista."
        actions={[{ label: "Novo Lead", href: "/leads/novo" }, { label: "Importar Base", href: "/importacao" }]}
      />
      <DashboardClient data={await getDashboard()} />
    </>
  );
}
