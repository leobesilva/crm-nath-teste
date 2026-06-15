"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Copy, MessageCircle, Pencil, PlugZap, Search, Trash2, Zap } from "lucide-react";
import { Modal } from "@/components/modal";
import { Badge, Card, EmptyState } from "@/components/ui";
import { IntegrationSource } from "@/lib/types";

const sourceTypes: IntegrationSource["tipo"][] = ["Formulário", "Página de Vendas", "WhatsApp", "Instagram", "Meta Lead Ads", "Manual", "Outro"];
const statuses: IntegrationSource["status"][] = ["Ativa", "Rascunho", "Pausada", "Erro"];

type SourceForm = {
  id?: string;
  nome: string;
  tipo: IntegrationSource["tipo"];
  origemPadrao: string;
  campanhaPadrao: string;
  produtoPadrao: string;
  provider: string;
  accountName: string;
  status: IntegrationSource["status"];
};

const emptyForm: SourceForm = {
  nome: "",
  tipo: "Formulário",
  origemPadrao: "Página de Vendas",
  campanhaPadrao: "",
  produtoPadrao: "Diagnóstico ALIANÇA",
  provider: "",
  accountName: "",
  status: "Ativa",
};

export function IntegrationSourcesClient({ initialSources }: { initialSources: IntegrationSource[] }) {
  const [sources, setSources] = useState(initialSources);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [guideSource, setGuideSource] = useState<IntegrationSource | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [form, setForm] = useState<SourceForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  const filteredSources = useMemo(() => {
    const needle = normalize(query);
    return sources.filter((source) => {
      const searchable = normalize([source.nome, source.tipo, source.provider, source.accountName, source.origemPadrao, source.campanhaPadrao].filter(Boolean).join(" "));
      if (needle && !searchable.includes(needle)) return false;
      if (statusFilter !== "Todos" && source.status !== statusFilter) return false;
      if (typeFilter !== "Todos" && source.tipo !== typeFilter) return false;
      return true;
    });
  }, [query, sources, statusFilter, typeFilter]);

  const totals = useMemo(
    () => ({
      active: sources.filter((source) => source.status === "Ativa").length,
      received: sources.reduce((sum, source) => sum + source.recebidos, 0),
      processed: sources.reduce((sum, source) => sum + source.processados, 0),
      errors: sources.reduce((sum, source) => sum + source.erros, 0),
    }),
    [sources],
  );

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setMessage("");
  }

  function editSource(source: IntegrationSource) {
    setEditingId(source.id);
    setFormOpen(true);
    setForm({
      id: source.id,
      nome: source.nome,
      tipo: source.tipo,
      origemPadrao: source.origemPadrao,
      campanhaPadrao: source.campanhaPadrao ?? "",
      produtoPadrao: source.produtoPadrao ?? "",
      provider: source.provider ?? "",
      accountName: source.accountName ?? "",
      status: source.status,
    });
    setMessage("");
  }

  async function saveSource() {
    if (!form.nome.trim()) return;
    setBusy(true);
    const response = await fetch("/api/integration-sources", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Não foi possível salvar a integração.");
      return;
    }
    setSources((current) => [payload.data, ...current.filter((source) => source.id !== payload.data.id)]);
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setMessage(editingId ? "Integração atualizada." : "Integração criada.");
  }

  async function deleteSource(source: IntegrationSource) {
    setBusy(true);
    const response = await fetch(`/api/integration-sources?id=${encodeURIComponent(source.id)}`, { method: "DELETE" });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Não foi possível excluir.");
      return;
    }
    setSources((current) => current.filter((item) => item.id !== source.id));
    setDeleteId(null);
    if (editingId === source.id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    setMessage("Integração excluída.");
  }

  async function copyWebhook(source: IntegrationSource) {
    const url = `${baseUrl}${source.webhookPath}`;
    await navigator.clipboard.writeText(url);
    setCopied(source.id);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied("guide");
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Fontes ativas" value={`${totals.active}/${sources.length}`} hint="Canais prontos para receber leads" tone="green" />
        <SummaryCard label="Recebidos" value={String(totals.received)} hint="Volume total vindo de webhooks" tone="blue" />
        <SummaryCard label="Processados" value={String(totals.processed)} hint="Entradas que viraram CRM ou duplicado" tone="green" />
        <SummaryCard label="Erros" value={String(totals.errors)} hint={totals.errors ? "Revise fontes com alerta" : "Fluxo saudável"} tone={totals.errors ? "amber" : "green"} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Fontes conectadas</h3>
            <p className="mt-1 text-sm text-slate-600">Configure canais, copie endpoints e acompanhe a saúde de cada entrada.</p>
          </div>
          <button onClick={startCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <PlugZap size={16} />
            Nova integração
          </button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-[#0f755a]">{message}</p> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar fonte, provedor, origem ou campanha"
              className="w-full rounded-md border border-[#c8d6dc] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
            <option>Todos</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClass}>
            <option>Todos</option>
            {sourceTypes.map((tipo) => <option key={tipo}>{tipo}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredSources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            baseUrl={baseUrl}
            copied={copied === source.id}
            confirmingDelete={deleteId === source.id}
            busy={busy}
            onCopy={() => copyWebhook(source)}
            onGuide={() => setGuideSource(source)}
            onEdit={() => editSource(source)}
            onAskDelete={() => setDeleteId(source.id)}
            onCancelDelete={() => setDeleteId(null)}
            onDelete={() => deleteSource(source)}
          />
        ))}
      </div>

      {!filteredSources.length ? <EmptyState title="Nenhuma integração encontrada" description="Ajuste a busca ou limpe os filtros para voltar a ver as fontes." /> : null}

      <Modal
        open={formOpen}
        title={editingId ? "Editar integração" : "Nova integração"}
        description="Defina origem, campanha padrão, provedor e status do canal. O webhook fica disponível no cartão da fonte."
        onClose={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }}
        size="lg"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome da fonte">
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Tipo">
            <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as IntegrationSource["tipo"] })} className={inputClass}>
              {sourceTypes.map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
          </Field>
          <Field label="Origem padrão">
            <input value={form.origemPadrao} onChange={(event) => setForm({ ...form, origemPadrao: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Campanha padrão">
            <input value={form.campanhaPadrao} onChange={(event) => setForm({ ...form, campanhaPadrao: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Produto padrão">
            <input value={form.produtoPadrao} onChange={(event) => setForm({ ...form, produtoPadrao: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Provedor">
            <input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Conta / página">
            <input value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as IntegrationSource["status"] })} className={inputClass}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">Cancelar</button>
          <button disabled={busy || !form.nome.trim()} onClick={saveSource} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">
            {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Criar fonte"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(guideSource)}
        title={guideSource ? `Guia de conexão: ${guideSource.nome}` : "Guia de conexão"}
        description="Use este roteiro para plugar o canal externo no CRM com campanha e UTMs padronizados."
        onClose={() => setGuideSource(null)}
        size="lg"
      >
        {guideSource ? <ConnectionGuide source={guideSource} baseUrl={baseUrl} copied={copied === "guide"} onCopy={copyText} /> : null}
      </Modal>
    </div>
  );
}

function SourceCard({
  source,
  baseUrl,
  copied,
  confirmingDelete,
  busy,
  onCopy,
  onGuide,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  source: IntegrationSource;
  baseUrl: string;
  copied: boolean;
  confirmingDelete: boolean;
  busy: boolean;
  onCopy: () => void;
  onGuide: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const health = source.erros ? "Revisar" : source.status === "Ativa" ? "Saudável" : "Preparar";

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-[#0b2434]">{source.nome}</h3>
            <Badge tone={statusTone(source.status)}>{source.status}</Badge>
            <Badge tone={source.erros ? "amber" : "green"}>{health}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{source.tipo} · {source.provider || source.accountName || "Provedor não informado"}</p>
        </div>
        <div className="flex gap-2">
          <IconButton label="Abrir guia" onClick={onGuide} icon="book" />
          <IconButton label="Editar integração" onClick={onEdit} icon="edit" />
          <IconButton label="Excluir integração" onClick={onAskDelete} icon="delete" danger />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Recebidos" value={source.recebidos} />
        <Metric label="Processados" value={source.processados} />
        <Metric label="Duplicados" value={source.duplicados} />
        <Metric label="Erros" value={source.erros} />
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Origem" value={source.origemPadrao} />
          <Info label="Campanha" value={source.campanhaPadrao || "-"} />
          <Info label="Produto" value={source.produtoPadrao || "-"} />
          <Info label="Última entrada" value={source.ultimaEntrada ? new Date(source.ultimaEntrada).toLocaleString("pt-BR") : "Sem entrada"} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-2 text-xs text-slate-700">{baseUrl}{source.webhookPath}</code>
          <button onClick={onCopy} className="inline-flex items-center gap-1 rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-xs font-semibold text-[#0b2434] hover:bg-slate-50">
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {confirmingDelete ? (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">Excluir esta integração?</p>
          <p className="mt-1">Entradas já recebidas continuam na entrada bruta e no histórico operacional.</p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={onDelete} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Confirmar</button>
            <button onClick={onCancelDelete} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Cancelar</button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function IconButton({ label, onClick, icon, danger = false }: { label: string; onClick: () => void; icon: "book" | "edit" | "delete"; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-md border p-2 ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-[#c8d6dc] text-[#0b2434] hover:bg-slate-50"}`} aria-label={label}>
      {icon === "book" ? <BookOpen className="h-4 w-4" /> : icon === "edit" ? <Pencil className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "green" | "amber" | "blue" }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#0b2434]">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={`rounded-md p-2 ${toneClass(tone)}`}>
          {tone === "blue" ? <MessageCircle className="h-5 w-5" /> : tone === "green" ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </div>
      </div>
    </Card>
  );
}

function ConnectionGuide({ source, baseUrl, copied, onCopy }: { source: IntegrationSource; baseUrl: string; copied: boolean; onCopy: (text: string) => void }) {
  const url = `${baseUrl}${source.webhookPath}`;
  const payload = JSON.stringify({
    nome: "Nome do lead",
    whatsapp: "(65) 99999-0000",
    email: "lead@email.com",
    dor_principal: "Falta de direção artística",
    utm_source: normalize(source.tipo).replaceAll(" ", "_"),
    utm_medium: source.tipo === "Meta Lead Ads" ? "lead_ads" : "webhook",
    utm_campaign: source.campanhaPadrao || "campanha-padrao",
    landing_page: "https://sua-pagina.com/oferta",
  }, null, 2);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Endpoint</p>
        <div className="mt-2 flex gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-2 text-xs text-slate-700">{url}</code>
          <button onClick={() => onCopy(url)} className="rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-xs font-semibold">{copied ? "Copiado" : "Copiar"}</button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {["Cole o endpoint no provedor", "Envie nome e contato", "Inclua UTMs/campanha"].map((step, index) => (
          <div key={step} className="rounded-lg border border-[#dbe4e8] p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Passo {index + 1}</p>
            <p className="mt-2 text-sm font-semibold text-[#0b2434]">{step}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#0b2434]">Payload recomendado</p>
          <button onClick={() => onCopy(payload)} className="rounded-md border border-[#c8d6dc] px-3 py-1.5 text-xs font-semibold">{copied ? "Copiado" : "Copiar JSON"}</button>
        </div>
        <pre className="crm-scrollbar max-h-72 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">{payload}</pre>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-lg font-semibold text-[#0b2434]">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-700">{value}</p>
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

function statusTone(status: IntegrationSource["status"]) {
  if (status === "Ativa") return "green" as const;
  if (status === "Erro") return "red" as const;
  if (status === "Pausada") return "amber" as const;
  return "blue" as const;
}

function toneClass(tone: "green" | "amber" | "blue") {
  if (tone === "green") return "bg-emerald-50 text-[#138a6a]";
  if (tone === "blue") return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
