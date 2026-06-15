import { ImportClient } from "@/components/import-client";
import { PageHeader } from "@/components/page-header";

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Importação de base" description="Assistente para validar CSV/XLSX, revisar duplicados e preparar a entrada de leads no CRM." />
      <ImportClient />
    </>
  );
}
