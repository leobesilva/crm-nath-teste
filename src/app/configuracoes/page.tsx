import { Database, KeyRound, ListChecks, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { LgpdClient } from "@/components/lgpd-client";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { UsersClient } from "@/components/users-client";
import { DORES_PRINCIPAIS, ETAPAS_FUNIL, MOTIVOS_PERDA, ORIGENS_INICIAIS } from "@/lib/constants";
import { listLeads, store } from "@/lib/store";

export const dynamic = "force-dynamic";

const groups = [
  { title: "Origens", items: [...ORIGENS_INICIAIS], icon: Database, tone: "blue" as const },
  { title: "Etapas do funil", items: [...ETAPAS_FUNIL], icon: ListChecks, tone: "green" as const },
  { title: "Motivos de perda", items: [...MOTIVOS_PERDA], icon: SlidersHorizontal, tone: "amber" as const },
  { title: "Dores principais", items: [...DORES_PRINCIPAIS], icon: ShieldCheck, tone: "blue" as const },
];

const permissionGroups = [
  { role: "Admin", description: "Acesso total, usuários, exportações, LGPD e configurações." },
  { role: "Gestor", description: "Edita operação comercial, campanhas, integrações, produtos e pipeline." },
  { role: "Usuário Básico", description: "Consulta leads, tarefas, pipeline e histórico sem alterar configurações." },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configurações" description="Administração de usuários, listas comerciais, permissões, preferências e LGPD." />

      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
          <div>
            <Badge tone="green">Governança do CRM</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Base operacional pronta para escalar</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Configure perfis de acesso, listas comerciais e ações sensíveis para manter o CRM consistente entre integrações, pipeline e relatórios.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Leads monitorados" value={String(listLeads().length)} icon={Users} />
            <HeroMetric label="Logs LGPD" value={String(store.auditLogs.length)} icon={KeyRound} />
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {permissionGroups.map((item) => (
          <Card key={item.role}>
            <Badge tone={item.role === "Admin" ? "green" : item.role === "Gestor" ? "blue" : "neutral"}>{item.role}</Badge>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map(({ title, items, icon: Icon, tone }) => (
          <Card key={title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={tone}>{title}</Badge>
                <h3 className="mt-3 text-2xl font-semibold text-[#0b2434]">{items.length}</h3>
                <p className="mt-1 text-sm text-slate-600">itens configurados</p>
              </div>
              <span className="rounded-md bg-slate-50 p-2 text-[#138a6a]">
                <Icon size={18} />
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {items.slice(0, 6).map((item) => (
                <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {item}
                </span>
              ))}
              {items.length > 6 ? <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">+{items.length - 6}</span> : null}
            </div>
          </Card>
        ))}
      </div>

      <UsersClient />
      <LgpdClient leads={listLeads()} initialLogs={store.auditLogs} />
    </>
  );
}

function HeroMetric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-200">{label}</span>
        <Icon size={18} />
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
