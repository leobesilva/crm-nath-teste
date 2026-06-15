"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, Mail, MessageCircle, MoveRight, Search, Sparkles } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { ETAPAS_FUNIL } from "@/lib/constants";
import { Lead } from "@/lib/types";

type FocusMode = "all" | "hot" | "stalled" | "closing";

function temperatureTone(value: string) {
  if (value === "Muito quente") return "red" as const;
  if (value === "Quente") return "amber" as const;
  if (value === "Morno") return "blue" as const;
  return "neutral" as const;
}

export function PipelineBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [temperature, setTemperature] = useState("");
  const [focus, setFocus] = useState<FocusMode>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filteredLeads = useMemo(() => {
    const search = normalize(query);
    return leads.filter((lead) => {
      const text = normalize([lead.nome, lead.email, lead.whatsapp, lead.origem, lead.campanha, lead.produtoInteresse, lead.proximaAcao].filter(Boolean).join(" "));
      if (search && !text.includes(search)) return false;
      if (temperature && lead.temperatura !== temperature) return false;
      if (focus === "hot" && lead.score < 60 && lead.temperatura !== "Quente" && lead.temperatura !== "Muito quente") return false;
      if (focus === "stalled" && lead.ultimaInteracao) return false;
      if (focus === "closing" && !["Proposta Enviada", "Diagnóstico Realizado"].includes(lead.etapaFunil)) return false;
      return true;
    });
  }, [focus, leads, query, temperature]);

  const grouped = useMemo(() => {
    return ETAPAS_FUNIL.map((etapa) => ({
      etapa,
      leads: filteredLeads.filter((lead) => lead.etapaFunil === etapa),
      totalScore: filteredLeads.filter((lead) => lead.etapaFunil === etapa).reduce((sum, lead) => sum + lead.score, 0),
    }));
  }, [filteredLeads]);

  const metrics = useMemo(() => {
    const hot = leads.filter((lead) => lead.score >= 60 || lead.temperatura === "Quente" || lead.temperatura === "Muito quente").length;
    const closing = leads.filter((lead) => ["Proposta Enviada", "Diagnóstico Realizado"].includes(lead.etapaFunil)).length;
    const won = leads.filter((lead) => lead.etapaFunil === "Venda Realizada" || lead.statusComercial === "Cliente Ativo").length;
    return { hot, closing, won };
  }, [leads]);

  async function moveLead(leadId: string, etapa: string) {
    const current = leads.find((lead) => lead.id === leadId);
    if (!current || current.etapaFunil === etapa) return;
    setBusyLeadId(leadId);
    setMessage("");
    setLeads((items) => items.map((lead) => (lead.id === leadId ? { ...lead, etapaFunil: etapa, statusComercial: etapa } : lead)));
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapaFunil: etapa, statusComercial: etapa }),
    });
    const payload = await response.json();
    setBusyLeadId(null);
    if (!response.ok || payload.error) {
      setLeads((items) => items.map((lead) => (lead.id === leadId ? current : lead)));
      setMessage(payload.error || "Nao foi possivel mover o lead.");
      return;
    }
    setMessage(`${current.nome} movido para ${etapa}.`);
  }

  function nextStage(lead: Lead) {
    const index = ETAPAS_FUNIL.findIndex((etapa) => etapa === lead.etapaFunil);
    return index >= 0 ? ETAPAS_FUNIL[index + 1] : undefined;
  }

  function clearFilters() {
    setQuery("");
    setTemperature("");
    setFocus("all");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <PipelineMetric label="Leads no funil" value={filteredLeads.length} hint={`${leads.length} no total`} active={focus === "all"} onClick={() => setFocus("all")} />
        <PipelineMetric label="Quentes" value={metrics.hot} hint="Priorizar contato" active={focus === "hot"} onClick={() => setFocus("hot")} />
        <PipelineMetric label="Fechamento" value={metrics.closing} hint="Proposta e diagnostico" active={focus === "closing"} onClick={() => setFocus("closing")} />
        <PipelineMetric label="Ganhos/ativos" value={metrics.won} hint="Resultado comercial" active={false} onClick={() => setFocus("all")} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Controle do funil</h3>
            <p className="mt-1 text-sm text-slate-600">Clique em um card para detalhes ou arraste para atualizar a etapa.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_auto] xl:w-[680px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead, campanha ou produto" className="w-full rounded-md border border-[#c8d6dc] py-2 pl-9 pr-3 text-sm" />
            </label>
            <select value={temperature} onChange={(event) => setTemperature(event.target.value)} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm">
              <option value="">Temperatura</option>
              {["Frio", "Morno", "Quente", "Muito quente"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <button onClick={clearFilters} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold">Limpar</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FocusChip active={focus === "all"} onClick={() => setFocus("all")}>Todos</FocusChip>
          <FocusChip active={focus === "hot"} onClick={() => setFocus("hot")}>Quentes</FocusChip>
          <FocusChip active={focus === "stalled"} onClick={() => setFocus("stalled")}>Sem interacao</FocusChip>
          <FocusChip active={focus === "closing"} onClick={() => setFocus("closing")}>Fechamento</FocusChip>
        </div>
        {message ? <p className="mt-3 text-sm font-medium text-[#138a6a]">{message}</p> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {grouped.map(({ etapa, leads: columnLeads, totalScore }) => (
          <section
            key={etapa}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => moveLead(event.dataTransfer.getData("text/plain"), etapa)}
            className="min-h-[340px] rounded-lg border border-[#dbe4e8] bg-slate-50 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0b2434]">{etapa}</h3>
                <p className="mt-1 text-xs text-slate-500">Score medio {columnLeads.length ? Math.round(totalScore / columnLeads.length) : 0}</p>
              </div>
              <Badge tone={columnLeads.length ? "blue" : "neutral"}>{columnLeads.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnLeads.map((lead) => (
                <PipelineCard
                  key={lead.id}
                  lead={lead}
                  busy={busyLeadId === lead.id}
                  nextStage={nextStage(lead)}
                  onOpen={() => setSelectedLead(lead)}
                  onMove={(stage) => moveLead(lead.id, stage)}
                />
              ))}
              {!columnLeads.length ? (
                <div className="rounded-md border border-dashed border-[#c8d6dc] bg-white p-4 text-center text-xs text-slate-500">
                  Solte leads aqui
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {!filteredLeads.length ? (
        <EmptyState title="Nenhum lead no recorte atual" description="Ajuste busca, temperatura ou modo de foco para visualizar o funil." />
      ) : null}

      <Modal
        open={Boolean(selectedLead)}
        title={selectedLead?.nome ?? "Lead"}
        description={selectedLead ? `${selectedLead.etapaFunil} - Score ${selectedLead.score}` : undefined}
        onClose={() => setSelectedLead(null)}
        size="lg"
      >
        {selectedLead ? (
          <LeadDetails
            lead={selectedLead}
            nextStage={nextStage(selectedLead)}
            onMove={(stage) => moveLead(selectedLead.id, stage)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function PipelineCard({ lead, busy, nextStage, onOpen, onMove }: { lead: Lead; busy: boolean; nextStage?: string; onOpen: () => void; onMove: (stage: string) => void }) {
  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", lead.id)}
      className="cursor-grab rounded-lg border border-[#dbe4e8] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="min-w-0 text-left">
          <p className="truncate font-semibold text-[#0b2434]">{lead.nome}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{lead.produtoInteresse || "Produto nao definido"}</p>
        </button>
        <button onClick={onOpen} className="rounded-md border border-[#dbe4e8] p-1.5 text-slate-600" aria-label="Ver detalhes">
          <Eye className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Badge tone={temperatureTone(lead.temperatura)}>{lead.temperatura}</Badge>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-[#0b2434]">Score {lead.score}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{lead.proximaAcao || "Sem proxima acao definida"}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-slate-500">{lead.responsavel || "Sem responsavel"}</span>
        {nextStage ? (
          <button disabled={busy} onClick={() => onMove(nextStage)} className="inline-flex items-center gap-1 rounded-md border border-[#c8d6dc] px-2 py-1 text-xs font-semibold text-[#0b2434] disabled:opacity-60">
            Avancar
            <MoveRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function LeadDetails({ lead, nextStage, onMove }: { lead: Lead; nextStage?: string; onMove: (stage: string) => void }) {
  const phone = lead.whatsapp || lead.telefone || "";
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Detail label="Temperatura" value={lead.temperatura} />
        <Detail label="Score" value={String(lead.score)} />
        <Detail label="Financeiro" value={lead.statusFinanceiro} />
        <Detail label="Origem" value={lead.origem || "-"} />
        <Detail label="Campanha" value={lead.campanha || "-"} />
        <Detail label="Produto" value={lead.produtoInteresse || "-"} />
      </div>
      <div className="rounded-md bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Proxima acao recomendada</p>
        <p className="mt-2 text-sm font-medium text-[#0b2434]">{lead.proximaAcao || "Sem proxima acao definida"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434]">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        ) : null}
        {lead.email ? (
          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434]">
            <Mail className="h-4 w-4" />
            E-mail
          </a>
        ) : null}
        {nextStage ? (
          <button onClick={() => onMove(nextStage)} className="inline-flex items-center gap-2 rounded-md bg-[#138a6a] px-3 py-2 text-sm font-semibold text-white">
            Avancar para {nextStage}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        <Link href={`/leads/${lead.id}`} className="inline-flex items-center gap-2 rounded-md bg-[#0b2434] px-3 py-2 text-sm font-semibold text-white">
          Abrir perfil completo
        </Link>
      </div>
    </div>
  );
}

function PipelineMetric({ label, value, hint, active, onClick }: { label: string; value: number; hint: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-lg border p-4 text-left shadow-sm transition ${active ? "border-[#138a6a] bg-emerald-50" : "border-[#dbe4e8] bg-white hover:border-[#9eb7c0]"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <Sparkles className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#0b2434]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </button>
  );
}

function FocusChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-[#0b2434] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-[#0b2434]">{value}</p>
    </div>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
