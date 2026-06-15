import { NewLeadForm } from "@/components/new-lead-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";

export default function NewLeadPage() {
  return (
    <>
      <PageHeader title="Novo Lead" description="Cadastro manual com os campos essenciais para aplicar score, temperatura e proxima acao." />
      <Card>
        <NewLeadForm />
      </Card>
    </>
  );
}
