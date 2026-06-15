"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Database, Eye, FileJson, Mail, MessageCircle, RefreshCw, Search, ShieldOff, Sparkles, XCircle } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { RawEntry } from "@/lib/types";

const statusFilters = ["Todos", "Pendente", "Processado", "Duplicado", "Erro", "Ignorado"] as const;

type StatusFilter = (typeof statusFilters)[number];

function tone(status: RawEntry["statusProcessamento"]) {
  if (status === "Processado") return "green" as const;
  if (status === "Duplicado") return "amber" as const;
  if (status === "Erro") return "red" as const;
  if (status === "Ignorado") return "neutral" as const;
  return "blue" as const;
}

function StatusIcon({ status }: { status: RawEntry["statusProcessamento"] }) {
  if (status === "Processado") return <CheckCircle2 size={14} />;
  if (status === "Duplicado") return <AlertTriangle size={14} />;
  if (status === "Erro") return <XCircle size={14} />;
  if (status === "Ignorado") return <ShieldOff size={14} />;
  return <Clock3 size={14} />;
}

export function RawEntriesClient({ initialEntries }: { initialEntries: RawEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(initialEntries[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Todos");

  const stats = useMemo(
    () => ({
      total: entries.length,
      pending: entries.filter((entry) => entry.statusProcessamento === "Pendente").length,
      processed: entries.filter((entry) => entry.statusProcessamento === "Processado").length,
      duplicates: entries.filter((entry) => entry.statusProcessamento === "Duplicado").length,
      errors: entries.filter((entry) => entry.statusProcessamento === "Erro").length,
    }),
    [entries],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return entries.filter((entry) => {
      const matchesStatus = status === "Todos" || entry.statusProcessamento === status;
      const haystack = normalize([entry.nomeOriginal, entry.emailOriginal, entry.telefoneOriginal, entry.fonte, entry.origemOriginal, entry.campanhaOriginal].filter(Boolean).join(" "));
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [entries, query, status]);

  const selected = entries.find((entry) => entry.id === selectedId) ?? filtered[0] ?? entries[0];
  const nextAction = buildNextAction(stats);

  async function runAction(id: string, action: "process" | "reprocess" | "ignore") {
    setBusyId(id);
    const response = await fetch(`/api/raw-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    const updated = payload.data?.entry ?? payload.data;
    if (updated?.id) {
      setEntries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setSelectedId(updated.id);
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge tone={nextAction.tone}>{nextAction.badge}</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Fila de triagem dos canais</h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">{nextAction.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <HeroMetric label="Pendentes" value={stats.pending} icon={Clock3} />
            <HeroMetric label="Com erro" value={stats.errors} icon={AlertTriangle} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Recebidos" value={stats.total} icon={Database} tone="blue" />
        <MetricCard label="Pendentes" value={stats.pending} icon={Clock3} tone="blue" />
        <MetricCard label="Processados" value={stats.processed} icon={CheckCircle2} tone="green" />
        <MetricCard label="Duplicados" value={stats.duplicates} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Erros" value={stats.errors} icon={XCircle} tone="red" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Caixa de entrada</h3>
            <p className="mt-1 text-sm text-slate-600">Pesquise, filtre e selecione um registro para revisar antes de processar.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar nome, fonte, contato..."
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
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                active={selected?.id === entry.id}
                busy={busyId === entry.id}
                onSelect={() => setSelectedId(entry.id)}
                onAction={runAction}
              />
            ))
          ) : (
            <EmptyState title="Nenhuma entrada encontrada" description="Ajuste a busca ou remova o filtro para voltar a ver a fila de triagem." />
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          {selected ? <DetailPanel entry={selected} busy={busyId === selected.id} onAction={runAction} /> : <EmptyState title="Sem registro selecionado" description="Quando uma entrada chegar, os detalhes aparecem aqui." />}
        </aside>
      </section>
    </div>
  );
}

function EntryCard({
  entry,
  active,
  busy,
  onSelect,
  onAction,
}: {
  entry: RawEntry;
  active: boolean;
  busy: boolean;
  onSelect: () => void;
  onAction: (id: string, action: "process" | "reprocess" | "ignore") => void;
}) {
  return (
    <article className={`rounded-lg border bg-white p-4 shadow-sm transition ${active ? "border-[#138a6a] ring-2 ring-emerald-100" : "border-[#dbe4e8] hover:border-[#9fb5bf]"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone(entry.statusProcessamento)}>{entry.statusProcessamento}</Badge>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <StatusIcon status={entry.statusProcessamento} />
              {formatDate(entry.criadoEm)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{entry.fonte}</span>
          </div>
          <h4 className="mt-3 truncate text-lg font-semibold text-[#0b2434]">{entry.nomeOriginal || "Lead sem nome"}</h4>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={15} />
              {entry.telefoneOriginal || "Sem telefone"}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Mail size={15} />
              <span className="max-w-[240px] truncate">{entry.emailOriginal || "Sem e-mail"}</span>
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {entry.origemOriginal ? <span className="rounded-full bg-slate-50 px-2 py-1">Origem: {entry.origemOriginal}</span> : null}
            {entry.campanhaOriginal ? <span className="rounded-full bg-slate-50 px-2 py-1">Campanha: {entry.campanhaOriginal}</span> : null}
            {entry.erroProcessamento ? <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">{entry.erroProcessamento}</span> : null}
          </div>
        </button>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ActionButton disabled={busy} onClick={() => onAction(entry.id, entry.statusProcessamento === "Processado" ? "reprocess" : "process")} icon={Sparkles}>
            {entry.statusProcessamento === "Processado" ? "Reprocessar" : "Processar"}
          </ActionButton>
          <ActionButton disabled={busy} onClick={() => onAction(entry.id, "ignore")} icon={ShieldOff} variant="secondary">
            Ignorar
          </ActionButton>
          <button onClick={onSelect} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
            <Eye size={16} />
            Detalhes
          </button>
        </div>
      </div>
    </article>
  );
}

function DetailPanel({ entry, busy, onAction }: { entry: RawEntry; busy: boolean; onAction: (id: string, action: "process" | "reprocess" | "ignore") => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={tone(entry.statusProcessamento)}>{entry.statusProcessamento}</Badge>
          <h3 className="mt-3 truncate text-lg font-semibold text-[#0b2434]">{entry.nomeOriginal || "Lead sem nome"}</h3>
          <p className="mt-1 text-sm text-slate-600">{entry.fonte} · {formatDate(entry.criadoEm)}</p>
        </div>
        {entry.leadId ? (
          <Link href={`/leads/${entry.leadId}`} className="rounded-md p-2 text-[#138a6a] hover:bg-emerald-50" aria-label="Abrir lead vinculado">
            <ArrowUpRight size={18} />
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3">
        <DetailRow label="Telefone" value={entry.telefoneOriginal || "-"} />
        <DetailRow label="E-mail" value={entry.emailOriginal || "-"} />
        <DetailRow label="Instagram" value={entry.instagramOriginal || "-"} />
        <DetailRow label="Origem" value={entry.origemOriginal || "-"} />
        <DetailRow label="Campanha" value={entry.campanhaOriginal || "-"} />
        <DetailRow label="Lead vinculado" value={entry.leadId || "-"} />
      </div>

      {entry.erroProcessamento ? (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Erro de processamento</p>
          <p className="mt-1 leading-5">{entry.erroProcessamento}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton disabled={busy} onClick={() => onAction(entry.id, entry.statusProcessamento === "Processado" ? "reprocess" : "process")} icon={busy ? RefreshCw : Sparkles}>
          {busy ? "Processando..." : entry.statusProcessamento === "Processado" ? "Reprocessar" : "Processar"}
        </ActionButton>
        <ActionButton disabled={busy} onClick={() => onAction(entry.id, "ignore")} icon={ShieldOff} variant="secondary">
          Ignorar
        </ActionButton>
      </div>

      <details className="mt-5 rounded-lg border border-[#dbe4e8] bg-slate-50">
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-[#0b2434]">
          <FileJson size={16} />
          Payload recebido
        </summary>
        <pre className="crm-scrollbar max-h-72 overflow-auto border-t border-[#dbe4e8] p-3 text-xs text-slate-700">{JSON.stringify(entry.payloadJson, null, 2)}</pre>
      </details>
    </Card>
  );
}

function HeroMetric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
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

function MetricCard({ label, value, icon: Icon, tone: badgeTone }: { label: string; value: number; icon: React.ElementType; tone: "blue" | "green" | "amber" | "red" }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={badgeTone}>{label}</Badge>
        <Icon className="text-slate-400" size={18} />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[#0b2434]">{value}</p>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#0b2434]">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  icon: Icon,
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variant === "primary" ? "bg-[#138a6a] text-white hover:bg-[#0f755a]" : "border border-[#c8d6dc] bg-white text-[#0b2434] hover:bg-slate-50"
      }`}
    >
      <Icon className={disabled ? "animate-spin" : ""} size={16} />
      {children}
    </button>
  );
}

function buildNextAction(stats: { pending: number; errors: number; duplicates: number }) {
  if (stats.errors > 0) {
    return {
      badge: "Revisar erros",
      tone: "red" as const,
      description: "Existem entradas que não viraram lead. Comece pelos erros para não perder contatos vindos dos canais.",
    };
  }
  if (stats.pending > 0) {
    return {
      badge: "Triagem pendente",
      tone: "blue" as const,
      description: "Há novos registros aguardando padronização. Processe os mais recentes e confirme duplicados antes de avançar.",
    };
  }
  if (stats.duplicates > 0) {
    return {
      badge: "Duplicados mapeados",
      tone: "amber" as const,
      description: "A fila está sem pendências, mas há duplicados que podem indicar atualização de contato ou campanha.",
    };
  }
  return {
    badge: "Fila organizada",
    tone: "green" as const,
    description: "As entradas recebidas estão processadas. Novos webhooks e importações aparecerão aqui para triagem.",
  };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
