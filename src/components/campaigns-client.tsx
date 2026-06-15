"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeDollarSign, BarChart3, CalendarDays, Flag, Pencil, Plus, Search, Target, TrendingUp, Users } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ORIGENS_INICIAIS } from "@/lib/constants";
import { Modal } from "@/components/modal";

type CampaignMetric = {
  id: string;
  nome: string;
  origem?: string | null;
  status: "Planejada" | "Ativa" | "Encerrada" | "Pausada" | string;
  investimento: number;
  leads: number;
  qualificados: number;
  diagnosticosAgendados: number;
  vendas: number;
  receita: number;
  cac: number | null;
  conversao: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
};

type CampaignForm = {
  id?: string;
  nome: string;
  origem: string;
  investimento: number;
  status: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
};

const emptyForm: CampaignForm = {
  nome: "",
  origem: "Instagram Orgânico",
  investimento: 0,
  status: "Planejada",
  dataInicio: "",
  dataFim: "",
  observacoes: "",
};

const statusFilters = ["Todas", "Ativa", "Planejada", "Pausada", "Encerrada"] as const;

export function CampaignsClient({ initialCampaigns }: { initialCampaigns: CampaignMetric[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("Todas");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return campaigns.filter((campaign) => {
      const matchesStatus = status === "Todas" || campaign.status === status;
      const haystack = normalize([campaign.nome, campaign.origem, campaign.status, campaign.observacoes].filter(Boolean).join(" "));
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [campaigns, query, status]);

  const totals = useMemo(
    () => ({
      investimento: campaigns.reduce((sum, campaign) => sum + campaign.investimento, 0),
      leads: campaigns.reduce((sum, campaign) => sum + campaign.leads, 0),
      vendas: campaigns.reduce((sum, campaign) => sum + campaign.vendas, 0),
      receita: campaigns.reduce((sum, campaign) => sum + campaign.receita, 0),
      active: campaigns.filter((campaign) => campaign.status === "Ativa").length,
    }),
    [campaigns],
  );

  const bestCampaign = useMemo(() => [...campaigns].sort((a, b) => b.receita - a.receita)[0], [campaigns]);
  const averageCac = totals.vendas ? totals.investimento / totals.vendas : null;

  async function saveCampaign() {
    if (!form.nome.trim()) return;
    setBusy(true);
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dataInicio: form.dataInicio || null,
        dataFim: form.dataFim || null,
        observacoes: form.observacoes || null,
      }),
    });
    const payload = await response.json();
    const saved = {
      ...payload.data,
      leads: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.leads ?? 0 : 0,
      qualificados: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.qualificados ?? 0 : 0,
      diagnosticosAgendados: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.diagnosticosAgendados ?? 0 : 0,
      vendas: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.vendas ?? 0 : 0,
      receita: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.receita ?? 0 : 0,
      cac: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.cac ?? null : null,
      conversao: form.id ? campaigns.find((campaign) => campaign.id === form.id)?.conversao ?? 0 : 0,
    };
    setCampaigns((current) => (form.id ? current.map((campaign) => (campaign.id === form.id ? saved : campaign)) : [saved, ...current]));
    setForm(emptyForm);
    setOpen(false);
    setBusy(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(campaign: CampaignMetric) {
    setForm({
      id: campaign.id,
      nome: campaign.nome,
      origem: campaign.origem ?? "Cadastro Manual",
      investimento: campaign.investimento,
      status: campaign.status,
      dataInicio: campaign.dataInicio ?? "",
      dataFim: campaign.dataFim ?? "",
      observacoes: campaign.observacoes ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
          <div>
            <Badge tone={totals.active ? "green" : "amber"}>{totals.active ? `${totals.active} ativa(s)` : "Sem campanha ativa"}</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Painel de campanhas</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Acompanhe investimento, origem, leads, vendas e receita para entender quais ações estão trazendo artistas com mais potencial.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Investimento" value={money(totals.investimento)} icon={BadgeDollarSign} />
            <HeroMetric label="Receita" value={money(totals.receita)} icon={TrendingUp} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads gerados" value={String(totals.leads)} icon={Users} tone="blue" />
        <MetricCard label="Vendas" value={String(totals.vendas)} icon={Target} tone="green" />
        <MetricCard label="CAC médio" value={averageCac === null ? "Dados insuficientes" : money(averageCac)} icon={BarChart3} tone="amber" />
        <MetricCard label="Melhor campanha" value={bestCampaign?.nome ?? "Sem dados"} icon={Flag} tone="green" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Campanhas cadastradas</h3>
            <p className="mt-1 text-sm text-slate-600">Filtre por status, busque por origem e acompanhe resultado sem tabela larga.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <Plus size={16} />
            Nova campanha
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar campanha, origem ou observação..."
              className="w-full rounded-md border border-[#c8d6dc] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${status === item ? "bg-[#138a6a] text-white" : "border border-[#dbe4e8] bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onEdit={() => openEdit(campaign)} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma campanha encontrada" description="Ajuste a busca ou o filtro de status para voltar a ver as campanhas cadastradas." />
      )}

      <Modal
        open={open}
        title={form.id ? "Editar campanha" : "Nova campanha"}
        description="Informe origem, investimento e status para acompanhar os resultados no dashboard e relatórios."
        onClose={() => setOpen(false)}
        size="lg"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome da campanha">
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Origem">
            <select value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} className={inputClass}>
              {ORIGENS_INICIAIS.map((origem) => <option key={origem}>{origem}</option>)}
            </select>
          </Field>
          <Field label="Investimento">
            <input value={form.investimento} onChange={(event) => setForm({ ...form, investimento: Number(event.target.value) })} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
              {["Planejada", "Ativa", "Encerrada", "Pausada"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Início">
            <input value={form.dataInicio} onChange={(event) => setForm({ ...form, dataInicio: event.target.value })} type="date" className={inputClass} />
          </Field>
          <Field label="Fim">
            <input value={form.dataFim} onChange={(event) => setForm({ ...form, dataFim: event.target.value })} type="date" className={inputClass} />
          </Field>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-semibold text-[#0b2434]">Observações</span>
            <textarea value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} rows={3} className={inputClass} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">Cancelar</button>
          <button disabled={busy || !form.nome.trim()} onClick={saveCampaign} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">
            {busy ? "Salvando..." : form.id ? "Salvar alterações" : "Criar campanha"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CampaignCard({ campaign, onEdit }: { campaign: CampaignMetric; onEdit: () => void }) {
  const conversion = Math.round(campaign.conversao * 100);
  const roi = campaign.investimento > 0 ? (campaign.receita - campaign.investimento) / campaign.investimento : null;

  return (
    <article className="rounded-lg border border-[#dbe4e8] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
            {campaign.origem ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{campaign.origem}</span> : null}
          </div>
          <h4 className="mt-3 truncate text-lg font-semibold text-[#0b2434]">{campaign.nome}</h4>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <CalendarDays size={15} />
            {dateRange(campaign.dataInicio, campaign.dataFim)}
          </p>
        </div>
        <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
          <Pencil size={16} />
          Editar
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Investimento" value={money(campaign.investimento)} />
        <MiniMetric label="Receita" value={money(campaign.receita)} highlight />
        <MiniMetric label="CAC" value={campaign.cac === null ? "Dados insuficientes" : money(campaign.cac)} />
        <MiniMetric label="ROI" value={roi === null ? "Dados insuficientes" : `${Math.round(roi * 100)}%`} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Progress label="Leads" value={campaign.leads} max={Math.max(campaign.leads, campaign.qualificados, campaign.diagnosticosAgendados, campaign.vendas, 1)} color="#0b5470" />
        <Progress label="Qualificados" value={campaign.qualificados} max={Math.max(campaign.leads, 1)} color="#138a6a" />
        <Progress label="Diagnósticos" value={campaign.diagnosticosAgendados} max={Math.max(campaign.leads, 1)} color="#f59e0b" />
        <Progress label="Vendas" value={campaign.vendas} max={Math.max(campaign.leads, 1)} color="#22c55e" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Conversão geral</p>
          <p className="mt-1 text-lg font-semibold text-[#0b2434]">{conversion}%</p>
        </div>
        <a href={`/leads?campanha=${encodeURIComponent(campaign.nome)}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#138a6a]">
          Ver leads <ArrowUpRight size={15} />
        </a>
      </div>
    </article>
  );
}

function HeroMetric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-200">{label}</span>
        <Icon size={18} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: "blue" | "green" | "amber" }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tone}>{label}</Badge>
        <Icon className="text-slate-400" size={18} />
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-[#0b2434]">{value}</p>
    </Card>
  );
}

function MiniMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${highlight ? "text-[#138a6a]" : "text-[#0b2434]"}`}>{value}</p>
    </div>
  );
}

function Progress({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-slate-600">{label}</span>
        <strong className="text-[#0b2434]">{value}</strong>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full" style={{ width: `${Math.max((value / max) * 100, value ? 8 : 0)}%`, background: color }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-[#0b2434]">{label}</span>
      {children}
    </label>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function statusTone(status: string) {
  if (status === "Ativa") return "green" as const;
  if (status === "Pausada") return "amber" as const;
  if (status === "Encerrada") return "neutral" as const;
  return "blue" as const;
}

function dateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "Período não informado";
  if (start && end) return `${formatDate(start)} até ${formatDate(end)}`;
  return start ? `Desde ${formatDate(start)}` : `Até ${formatDate(end ?? "")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
