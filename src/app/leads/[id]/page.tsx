import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadActionsClient } from "@/components/lead-actions-client";
import { MergeLeadForm } from "@/components/merge-lead-form";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { getLead, getLeads } from "@/lib/db-adapter";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const interactions = store.interactions.filter((item) => item.leadId === lead.id);
  const tasks = store.tasks.filter((item) => item.leadId === lead.id);
  const leads = await getLeads();

  return (
    <>
      <PageHeader
        title={lead.nome}
        description={`${lead.dorPrincipal || "Sem dor mapeada"} - ${lead.momentoArtistico || "Momento não informado"}`}
        actions={[{ label: "Registrar Interação", href: `/historico?leadId=${lead.id}` }, { label: "Criar Tarefa", href: `/tarefas?leadId=${lead.id}` }]}
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="WhatsApp" value={lead.whatsapp || "-"} />
            <Info label="E-mail" value={lead.email || "-"} />
            <Info label="Instagram" value={lead.instagram || "-"} />
            <Info label="Origem" value={lead.origem || "-"} />
            <Info label="Campanha" value={lead.campanha || "-"} />
            <Info label="Produto" value={lead.produtoInteresse || "-"} />
            <Info label="Etapa" value={lead.etapaFunil} />
            <Info label="Temperatura" value={lead.temperatura} />
            <Info label="Score" value={String(lead.score)} />
            <Info label="Status financeiro" value={lead.statusFinanceiro} />
            <Info label="Valor pago" value={`R$ ${lead.valorPago.toLocaleString("pt-BR")}`} />
            <Info label="Valor vencido" value={`R$ ${lead.valorVencido.toLocaleString("pt-BR")}`} />
          </div>
          <LeadActionsClient lead={lead} />
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-[#0b2434]">Próxima ação</h3>
          <p className="mt-2 text-lg font-semibold text-[#138a6a]">{lead.proximaAcao}</p>
          <p className="mt-4 text-sm text-slate-600">{lead.observacoes || "Sem observações adicionais registradas."}</p>
          <Link href="/pipeline" className="mt-6 inline-flex rounded-md bg-[#0b2434] px-4 py-2 text-sm font-semibold text-white">Ver no Pipeline</Link>
          <MergeLeadForm targetLeadId={lead.id} candidates={leads.filter((item) => item.id !== lead.id)} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-[#0b2434]">Histórico de interações</h3>
          <div className="space-y-3">
            {interactions.length ? interactions.map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <Badge tone="blue">{item.tipo}</Badge>
                <p className="mt-2 font-medium">{item.descricao}</p>
                <p className="text-xs text-slate-500">{item.resultado}</p>
              </div>
            )) : <p className="text-sm text-slate-600">Nenhuma interação registrada nesta sessão.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 text-base font-semibold text-[#0b2434]">Tarefas</h3>
          <div className="space-y-3">
            {tasks.length ? tasks.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-medium">{item.titulo}</p>
                  <p className="text-xs text-slate-500">{item.tipo}</p>
                </div>
                <Badge tone={item.status === "Atrasada" ? "red" : "green"}>{item.status}</Badge>
              </div>
            )) : <p className="text-sm text-slate-600">Nenhuma tarefa local encontrada.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-[#0b2434]">{value}</p>
    </div>
  );
}
