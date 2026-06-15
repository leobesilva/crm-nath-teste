import { HistoryClient } from "@/components/history-client";
import { PageHeader } from "@/components/page-header";
import { listLeads, store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="Histórico de interações" description="Linha do tempo de WhatsApp, e-mail, ligações, diagnósticos, propostas, observações e eventos de sistema." />
      <HistoryClient initialInteractions={store.interactions} leads={listLeads()} />
    </>
  );
}
