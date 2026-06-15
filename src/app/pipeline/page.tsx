import { PageHeader } from "@/components/page-header";
import { PipelineBoard } from "@/components/pipeline-board";
import { getLeads } from "@/lib/db-adapter";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  return (
    <>
      <PageHeader title="Pipeline comercial" description="Priorize oportunidades, filtre o funil e avance leads com contexto sem sair da tela." />
      <PipelineBoard initialLeads={await getLeads()} />
    </>
  );
}
