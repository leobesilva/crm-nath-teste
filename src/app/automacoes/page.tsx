import { AutomationsClient } from "@/components/automations-client";
import { PageHeader } from "@/components/page-header";

export default function AutomationsPage() {
  return (
    <>
      <PageHeader title="Automações e regras comerciais" description="Central para testar score, temperatura, produto sugerido, próxima ação e prioridade financeira." />
      <AutomationsClient />
    </>
  );
}
