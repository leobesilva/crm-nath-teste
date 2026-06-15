import { CampaignsClient } from "@/components/campaigns-client";
import { PageHeader } from "@/components/page-header";
import { listCampaignsWithMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campanhas e origens"
        description="Gestão de campanhas com investimento, origem, leads, diagnósticos, vendas, receita, CAC e conversão."
      />
      <CampaignsClient initialCampaigns={listCampaignsWithMetrics()} />
    </>
  );
}
