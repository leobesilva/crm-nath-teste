import { CheckCircle2, CircleAlert, Database, KeyRound, PlugZap } from "lucide-react";
import { IntegrationSourcesClient } from "@/components/integration-sources-client";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { dataMode, getIntegrationSources } from "@/lib/db-adapter";
import { isDatabaseConfigured } from "@/lib/prisma";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const envItems = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export default async function IntegrationsPage() {
  const databaseConfigured = isDatabaseConfigured();
  const supabaseConfigured = isSupabaseConfigured();
  const sources = await getIntegrationSources();
  const activeSources = sources.filter((source) => source.status === "Ativa").length;
  const received = sources.reduce((sum, source) => sum + source.recebidos, 0);
  const errors = sources.reduce((sum, source) => sum + source.erros, 0);
  const readiness = [databaseConfigured, supabaseConfigured, activeSources > 0].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Integrações"
        description="Conecte WhatsApp, Instagram, formulários, páginas de venda e anúncios para padronizar a entrada de leads."
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-[#0b2434] bg-[#0b2434] text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <PlugZap className="h-4 w-4" />
                Central de captação
              </div>
              <h3 className="mt-4 text-2xl font-semibold">Prontidão das integrações: {readiness}/3</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cada canal precisa chegar com origem, campanha, produto e endpoint corretos antes de alimentar o CRM.
              </p>
            </div>
            <div className="grid min-w-64 gap-2 text-sm">
              <ReadinessItem done={databaseConfigured} label="Banco real conectado" />
              <ReadinessItem done={supabaseConfigured} label="Supabase Auth configurado" />
              <ReadinessItem done={activeSources > 0} label="Ao menos uma fonte ativa" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <HeroMetric label="Fontes ativas" value={`${activeSources}/${sources.length}`} />
            <HeroMetric label="Leads recebidos" value={String(received)} />
            <HeroMetric label="Erros" value={String(errors)} tone={errors ? "amber" : "green"} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-[#138a6a]">
              {errors ? <CircleAlert className="h-5 w-5 text-amber-700" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0b2434]">Próxima melhor ação</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {errors
                  ? "Revise as fontes com erro antes de ativar novas campanhas."
                  : activeSources
                    ? "Abra o guia da fonte ativa e cole o endpoint no provedor do canal."
                    : "Crie ou ative uma fonte para começar a receber leads por webhook."}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <ChecklistItem icon={<Database className="h-4 w-4" />} label={dataMode() === "database" ? "Dados indo para Supabase" : "Rodando em modo demo"} done={databaseConfigured} />
            <ChecklistItem icon={<KeyRound className="h-4 w-4" />} label="Tokens de webhook gerados por fonte" done={sources.some((source) => source.webhookToken || source.webhookPath.includes("token="))} />
            <ChecklistItem icon={<PlugZap className="h-4 w-4" />} label="Guias por canal disponíveis nos cards" done />
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <IntegrationSourcesClient initialSources={sources} />
      </div>

      <Card className="mt-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Ambiente necessário</h3>
            <p className="mt-1 text-sm text-slate-600">Estas variáveis mantêm banco, autenticação e webhooks funcionando.</p>
          </div>
          <Badge tone={databaseConfigured && supabaseConfigured ? "green" : "amber"}>{databaseConfigured && supabaseConfigured ? "Completo" : "Revisar"}</Badge>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {envItems.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              <span>{item}</span>
              <CheckCircle2 className="h-4 w-4 text-[#138a6a]" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ReadinessItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
      <CheckCircle2 className={`h-4 w-4 ${done ? "text-emerald-200" : "text-slate-400"}`} />
      <span className={done ? "text-white" : "text-slate-300"}>{label}</span>
    </div>
  );
}

function HeroMetric({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "amber" }) {
  return (
    <div className="rounded-md bg-white/10 p-3">
      <p className="text-xs font-semibold uppercase text-slate-300">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone === "amber" ? "text-amber-200" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ChecklistItem({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
      <div className={done ? "text-[#138a6a]" : "text-slate-400"}>{icon}</div>
      <span className="flex-1 text-slate-700">{label}</span>
      <Badge tone={done ? "green" : "amber"}>{done ? "OK" : "Pendente"}</Badge>
    </div>
  );
}
