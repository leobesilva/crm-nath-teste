import { PageHeader } from "@/components/page-header";
import { RawEntriesClient } from "@/components/raw-entries-client";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function RawEntriesPage() {
  return (
    <>
      <PageHeader title="Entrada bruta de leads" description="Inbox de triagem para registros recebidos por integrações, webhooks e importações antes de virar CRM." />
      <RawEntriesClient initialEntries={store.rawEntries} />
    </>
  );
}
