"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, ClipboardList, FileText, Mail, MessageCircle, Plus, Search, Settings2, Target, UserRound } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Interaction, Lead } from "@/lib/types";
import { TIPOS_INTERACAO } from "@/lib/constants";
import { Modal } from "@/components/modal";

const typeFilters = ["Todos", ...TIPOS_INTERACAO] as const;

export function HistoryClient({ initialInteractions, leads }: { initialInteractions: Interaction[]; leads: Lead[] }) {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId") || leads[0]?.id || "";
  const [interactions, setInteractions] = useState(initialInteractions);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("Todos");
  const [leadFilter, setLeadFilter] = useState(searchParams.get("leadId") || "Todos");
  const [form, setForm] = useState({
    leadId: initialLeadId,
    tipo: "WhatsApp",
    descricao: "",
    resultado: "",
  });

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const stats = useMemo(
    () => ({
      total: interactions.length,
      whatsapp: interactions.filter((interaction) => interaction.tipo === "WhatsApp").length,
      system: interactions.filter((interaction) => interaction.tipo === "Sistema").length,
      withResult: interactions.filter((interaction) => interaction.resultado).length,
    }),
    [interactions],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return interactions.filter((interaction) => {
      const lead = leadById.get(interaction.leadId);
      const matchesType = type === "Todos" || interaction.tipo === type;
      const matchesLead = leadFilter === "Todos" || interaction.leadId === leadFilter;
      const haystack = normalize([lead?.nome, interaction.tipo, interaction.descricao, interaction.resultado].filter(Boolean).join(" "));
      return matchesType && matchesLead && (!needle || haystack.includes(needle));
    });
  }, [interactions, leadById, leadFilter, query, type]);

  async function createInteraction() {
    if (!form.leadId || !form.descricao.trim()) return;
    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, resultado: form.resultado || undefined }),
    });
    const payload = await response.json();
    setInteractions((current) => [payload.data, ...current]);
    setForm((current) => ({ ...current, descricao: "", resultado: "" }));
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="green">Linha do tempo</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Histórico de relacionamento</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Veja conversas, propostas, diagnósticos e eventos de sistema para entender o contexto antes do próximo contato.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Interações" value={String(stats.total)} icon={ClipboardList} />
            <HeroMetric label="Com resultado" value={String(stats.withResult)} icon={Target} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={String(stats.total)} icon={ClipboardList} tone="blue" />
        <MetricCard label="WhatsApp" value={String(stats.whatsapp)} icon={MessageCircle} tone="green" />
        <MetricCard label="Sistema" value={String(stats.system)} icon={Settings2} tone="amber" />
        <MetricCard label="Leads com histórico" value={String(new Set(interactions.map((item) => item.leadId)).size)} icon={UserRound} tone="blue" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Registros de relacionamento</h3>
            <p className="mt-1 text-sm text-slate-600">Filtre por lead, canal ou palavra-chave antes de registrar uma nova interação.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <Plus size={16} />
            Registrar interação
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar descrição, resultado, lead..."
              className="w-full rounded-md border border-[#c8d6dc] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <select value={leadFilter} onChange={(event) => setLeadFilter(event.target.value)} className={inputClass}>
            <option value="Todos">Todos os leads</option>
            {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome}</option>)}
          </select>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${type === item ? "bg-[#138a6a] text-white" : "border border-[#dbe4e8] bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((interaction) => <TimelineItem key={interaction.id} interaction={interaction} lead={leadById.get(interaction.leadId)} />)
          ) : (
            <EmptyState title="Nenhuma interação encontrada" description="Ajuste os filtros ou registre um novo contato para alimentar o histórico." />
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Como usar bem</h3>
            <div className="mt-4 space-y-3">
              <Guideline icon={MessageCircle} title="Registre contexto" description="Inclua objeções, combinados e sinais de intenção." />
              <Guideline icon={Target} title="Escreva resultado" description="Resultado curto facilita próximo follow-up." />
              <Guideline icon={FileText} title="Preserve rastreabilidade" description="Eventos de sistema ajudam a entender mudanças no funil." />
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={open} title="Registrar interação" description="Adicione uma anotação comercial vinculada ao lead." onClose={() => setOpen(false)} size="lg">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Lead">
            <select value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })} className={inputClass}>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className={inputClass}>
              {TIPOS_INTERACAO.map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
          </Field>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-semibold text-[#0b2434]">Descrição</span>
            <textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} rows={4} className={inputClass} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-semibold text-[#0b2434]">Resultado</span>
            <input value={form.resultado} onChange={(event) => setForm({ ...form, resultado: event.target.value })} className={inputClass} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">Cancelar</button>
          <button disabled={!form.leadId || !form.descricao.trim()} onClick={createInteraction} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">Registrar</button>
        </div>
      </Modal>
    </div>
  );
}

function TimelineItem({ interaction, lead }: { interaction: Interaction; lead?: Lead }) {
  return (
    <article className="rounded-lg border border-[#dbe4e8] bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#138a6a]">
          <InteractionIcon type={interaction.tipo} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={interaction.tipo === "Sistema" ? "amber" : "blue"}>{interaction.tipo}</Badge>
                <span className="text-xs font-medium text-slate-500">{formatDateTime(interaction.criadoEm)}</span>
              </div>
              <h4 className="mt-2 truncate text-base font-semibold text-[#0b2434]">{lead?.nome || interaction.leadId}</h4>
            </div>
            <Link href={`/leads/${interaction.leadId}`} className="rounded-md p-2 text-[#138a6a] hover:bg-emerald-50" aria-label="Abrir lead">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{interaction.descricao}</p>
          {interaction.resultado ? (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Resultado</p>
              <p className="mt-1 font-medium text-[#0b2434]">{interaction.resultado}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function InteractionIcon({ type }: { type: string }) {
  if (type === "WhatsApp") return <MessageCircle size={18} />;
  if (type === "E-mail") return <Mail size={18} />;
  if (type === "Sistema") return <Settings2 size={18} />;
  if (type === "Proposta" || type === "Diagnóstico") return <Target size={18} />;
  return <ClipboardList size={18} />;
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

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: "blue" | "green" | "amber" }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tone}>{label}</Badge>
        <Icon className="text-slate-400" size={18} />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[#0b2434]">{value}</p>
    </Card>
  );
}

function Guideline({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
      <span className="rounded-md bg-white p-2 text-[#138a6a]">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#0b2434]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
