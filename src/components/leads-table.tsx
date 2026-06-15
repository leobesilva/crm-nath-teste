"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Mail, MessageCircle, Phone, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Lead } from "@/lib/types";

function temperatureTone(value: string) {
  if (value === "Muito quente") return "red" as const;
  if (value === "Quente") return "amber" as const;
  if (value === "Morno") return "blue" as const;
  return "neutral" as const;
}

function priorityLabel(lead: Lead) {
  if (lead.score >= 75 || lead.temperatura === "Muito quente") return "Prioridade alta";
  if (lead.score >= 55 || lead.temperatura === "Quente") return "Boa oportunidade";
  return "Acompanhar";
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [temperature, setTemperature] = useState("");
  const [financial, setFinancial] = useState("");
  const [quick, setQuick] = useState<"all" | "hot" | "no-contact" | "overdue">("all");

  const stages = useMemo(() => unique(leads.map((lead) => lead.etapaFunil)), [leads]);
  const temperatures = useMemo(() => unique(leads.map((lead) => lead.temperatura)), [leads]);
  const financialStatuses = useMemo(() => unique(leads.map((lead) => lead.statusFinanceiro)), [leads]);

  const filtered = useMemo(() => {
    const search = normalize(query);
    return leads
      .filter((lead) => {
        const content = normalize([
          lead.nome,
          lead.whatsapp,
          lead.telefone,
          lead.email,
          lead.cpfCnpj,
          lead.instagram,
          lead.origem,
          lead.campanha,
          lead.dorPrincipal,
          lead.produtoInteresse,
        ].filter(Boolean).join(" "));
        if (search && !content.includes(search)) return false;
        if (stage && lead.etapaFunil !== stage) return false;
        if (temperature && lead.temperatura !== temperature) return false;
        if (financial && lead.statusFinanceiro !== financial) return false;
        if (quick === "hot" && lead.score < 60 && lead.temperatura !== "Quente" && lead.temperatura !== "Muito quente") return false;
        if (quick === "no-contact" && lead.ultimaInteracao) return false;
        if (quick === "overdue" && lead.valorVencido <= 0) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [financial, leads, query, quick, stage, temperature]);

  const metrics = useMemo(() => {
    const hot = leads.filter((lead) => lead.score >= 60 || lead.temperatura === "Quente" || lead.temperatura === "Muito quente").length;
    const noContact = leads.filter((lead) => !lead.ultimaInteracao).length;
    const overdue = leads.filter((lead) => lead.valorVencido > 0).length;
    const withWhatsapp = leads.filter((lead) => lead.whatsapp || lead.telefone).length;
    return { hot, noContact, overdue, withWhatsapp };
  }, [leads]);

  function clearFilters() {
    setQuery("");
    setStage("");
    setTemperature("");
    setFinancial("");
    setQuick("all");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Insight label="Leads filtrados" value={filtered.length} hint={`${leads.length} no total`} active={quick === "all"} onClick={() => setQuick("all")} />
        <Insight label="Oportunidades quentes" value={metrics.hot} hint="Score alto ou temperatura quente" active={quick === "hot"} onClick={() => setQuick("hot")} />
        <Insight label="Sem interação" value={metrics.noContact} hint="Pedir primeiro contato" active={quick === "no-contact"} onClick={() => setQuick("no-contact")} />
        <Insight label="Com valor vencido" value={metrics.overdue} hint="Acao financeira" active={quick === "overdue"} onClick={() => setQuick("overdue")} />
      </div>

      <Card className="p-0">
        <div className="border-b border-[#dbe4e8] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-md border border-[#c8d6dc] py-2 pl-9 pr-3 text-sm"
                placeholder="Buscar por nome, WhatsApp, e-mail, campanha, dor ou produto"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[570px]">
              <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm">
                <option value="">Todas as etapas</option>
                {stages.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={temperature} onChange={(event) => setTemperature(event.target.value)} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm">
                <option value="">Temperatura</option>
                {temperatures.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={financial} onChange={(event) => setFinancial(event.target.value)} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm">
                <option value="">Financeiro</option>
                {financialStatuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterChip active={quick === "all"} onClick={() => setQuick("all")}>Todos</FilterChip>
            <FilterChip active={quick === "hot"} onClick={() => setQuick("hot")}>Quentes</FilterChip>
            <FilterChip active={quick === "no-contact"} onClick={() => setQuick("no-contact")}>Sem interação</FilterChip>
            <FilterChip active={quick === "overdue"} onClick={() => setQuick("overdue")}>Financeiro vencido</FilterChip>
            {(query || stage || temperature || financial || quick !== "all") ? (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md border border-[#c8d6dc] px-3 py-1.5 text-xs font-semibold text-slate-700">
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-[#edf2f4]">
            {filtered.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState title="Nenhum lead encontrado" description="Ajuste os filtros ou limpe a busca para voltar a visualizar a base comercial." />
          </div>
        )}
      </Card>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const phone = lead.whatsapp || lead.telefone || "";
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "";
  return (
    <article className={`grid gap-4 border-l-4 p-4 transition hover:bg-slate-50 xl:grid-cols-[1.3fr_1fr_1fr_1.1fr_auto] xl:items-center ${lead.score >= 70 ? "border-l-amber-400" : "border-l-transparent"}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#0b2434]">{lead.nome}</h3>
          <Badge tone={temperatureTone(lead.temperatura)}>{lead.temperatura}</Badge>
          <Badge tone={lead.score >= 70 ? "amber" : "neutral"}>{priorityLabel(lead)}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          {phone ? <ContactPill icon="phone" value={phone} /> : <span>Sem telefone</span>}
          {lead.email ? <ContactPill icon="mail" value={lead.email} /> : <span>Sem e-mail</span>}
        </div>
      </div>
      <Info label="Origem / campanha" value={[lead.origem, lead.campanha].filter(Boolean).join(" - ") || "-"} />
      <Info label="Dor / produto" value={[lead.dorPrincipal, lead.produtoInteresse].filter(Boolean).join(" - ") || "-"} />
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">{lead.etapaFunil}</Badge>
          <Badge tone="blue">Score {lead.score}</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-700">{lead.proximaAcao || "Sem próxima ação definida"}</p>
        <p className="mt-1 text-xs text-slate-500">{lead.statusFinanceiro}</p>
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-[#c8d6dc] p-2 text-[#0b2434]" aria-label="Abrir WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
        ) : null}
        {lead.email ? (
          <a href={`mailto:${lead.email}`} className="inline-flex items-center justify-center rounded-md border border-[#c8d6dc] p-2 text-[#0b2434]" aria-label="Enviar e-mail">
            <Mail className="h-4 w-4" />
          </a>
        ) : null}
        <Link href={`/leads/${lead.id}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-3 py-2 text-sm font-semibold text-white">
          Abrir
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function Insight({ label, value, hint, active, onClick }: { label: string; value: number; hint: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-lg border p-4 text-left shadow-sm transition ${active ? "border-[#138a6a] bg-emerald-50" : "border-[#dbe4e8] bg-white hover:border-[#9eb7c0]"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#0b2434]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-[#0b2434] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
      {children}
    </button>
  );
}

function ContactPill({ icon, value }: { icon: "phone" | "mail"; value: string }) {
  const Icon = icon === "phone" ? Phone : Mail;
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function unique(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
