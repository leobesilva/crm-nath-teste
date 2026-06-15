"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ClipboardCheck, Flame, Gauge, MessageCircle, RefreshCw, Sparkles, Target, Wallet } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { DORES_PRINCIPAIS, ORIGENS_INICIAIS } from "@/lib/constants";

type Simulation = {
  score: number;
  temperatura: string;
  produtoSugerido: string;
  proximaAcao: string;
  statusFinanceiro: string;
};

const scenarios = [
  {
    id: "instagram-quente",
    title: "Lead quente do Instagram",
    description: "Respondeu contato e pediu diagnóstico.",
    patch: { origem: "Instagram Orgânico", respondeuContato: true, pediuPrecoOuDiagnostico: true, valorPago: 0, valorVencido: 0, valorAVencer: 0 },
  },
  {
    id: "lista-antiga",
    title: "Base antiga para reativar",
    description: "Já comprou antes, mas precisa novo convite.",
    patch: { origem: "Lista Antiga", respondeuContato: false, pediuPrecoOuDiagnostico: false, valorPago: 297, valorVencido: 0, valorAVencer: 0 },
  },
  {
    id: "inadimplente",
    title: "Cliente com financeiro vencido",
    description: "Prioridade vira regularização financeira.",
    patch: { origem: "WhatsApp", respondeuContato: true, pediuPrecoOuDiagnostico: false, valorPago: 0, valorVencido: 297, valorAVencer: 0 },
  },
] as const;

const ruleCards = [
  { title: "Score", description: "Pontuação de 0 a 100 por contato, origem, dor, interesse, resposta e histórico financeiro.", icon: Gauge, tone: "blue" as const },
  { title: "Temperatura", description: "Frio, morno, quente ou muito quente conforme intenção e comportamento comercial.", icon: Flame, tone: "red" as const },
  { title: "Produto sugerido", description: "A dor artística direciona diagnóstico, comunidade, premium ou projeto.", icon: Target, tone: "green" as const },
  { title: "Próxima ação", description: "Define WhatsApp, nutrição, diagnóstico, proposta, cobrança ou reativação.", icon: ClipboardCheck, tone: "amber" as const },
  { title: "Financeiro", description: "Valores pagos, vencidos e a vencer mudam status e prioridade de atendimento.", icon: Wallet, tone: "green" as const },
  { title: "Duplicidade", description: "CPF/CNPJ e telefone são sinais fortes; e-mail e nome/cidade entram como apoio.", icon: AlertTriangle, tone: "amber" as const },
];

export function AutomationsClient() {
  const [form, setForm] = useState({
    nome: "Simulação de Lead",
    whatsapp: "(65) 99999-0000",
    email: "lead@example.com",
    origem: "Instagram Orgânico",
    dorPrincipal: "Falta de direção artística",
    consentimentoContato: true,
    respondeuContato: false,
    pediuPrecoOuDiagnostico: false,
    valorPago: 0,
    valorVencido: 0,
    valorAVencer: 0,
  });
  const [result, setResult] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState(false);

  const readiness = useMemo(() => {
    const items = [
      Boolean(form.whatsapp || form.email),
      Boolean(form.origem),
      Boolean(form.dorPrincipal),
      form.consentimentoContato,
      form.respondeuContato || form.pediuPrecoOuDiagnostico || form.valorPago > 0 || form.valorVencido > 0,
    ];
    return Math.round((items.filter(Boolean).length / items.length) * 100);
  }, [form]);

  async function simulate() {
    setBusy(true);
    const response = await fetch("/api/automations/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setResult(payload.data);
    setBusy(false);
  }

  function applyScenario(patch: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...patch }));
    setResult(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <Badge tone="green">Motor comercial</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Teste a decisão automática antes de usar no CRM</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Simule entradas de WhatsApp, Instagram, formulários e base antiga para entender score, temperatura, produto indicado e próxima ação.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-200">Qualidade do cenário</span>
              <Activity size={18} />
            </div>
            <p className="mt-2 text-3xl font-semibold">{readiness}%</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-[#25d199]" style={{ width: `${readiness}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#0b2434]">Cenários rápidos</h3>
                <p className="mt-1 text-sm text-slate-600">Comece por um caso comum e ajuste os detalhes.</p>
              </div>
              <Badge tone="blue">3 modelos</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => applyScenario(scenario.patch)}
                  className="rounded-lg border border-[#dbe4e8] bg-white p-4 text-left transition hover:border-[#138a6a] hover:bg-emerald-50/40"
                >
                  <p className="font-semibold text-[#0b2434]">{scenario.title}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{scenario.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Dados do lead</h3>
            <div className="mt-4 grid gap-3">
              <Field label="Nome">
                <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="WhatsApp">
                  <input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className={inputClass} />
                </Field>
                <Field label="E-mail">
                  <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Origem">
                  <select value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} className={inputClass}>
                    {ORIGENS_INICIAIS.map((origem) => <option key={origem}>{origem}</option>)}
                  </select>
                </Field>
                <Field label="Dor principal">
                  <select value={form.dorPrincipal} onChange={(event) => setForm({ ...form, dorPrincipal: event.target.value })} className={inputClass}>
                    {DORES_PRINCIPAIS.map((dor) => <option key={dor}>{dor}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Comportamento e financeiro</h3>
            <div className="mt-4 grid gap-3">
              <Toggle label="Consentiu contato" checked={form.consentimentoContato} onChange={(checked) => setForm({ ...form, consentimentoContato: checked })} />
              <Toggle label="Respondeu contato" checked={form.respondeuContato} onChange={(checked) => setForm({ ...form, respondeuContato: checked })} />
              <Toggle label="Pediu preço ou diagnóstico" checked={form.pediuPrecoOuDiagnostico} onChange={(checked) => setForm({ ...form, pediuPrecoOuDiagnostico: checked })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <MoneyField label="Pago" value={form.valorPago} onChange={(value) => setForm({ ...form, valorPago: value })} />
                <MoneyField label="Vencido" value={form.valorVencido} onChange={(value) => setForm({ ...form, valorVencido: value })} />
                <MoneyField label="A vencer" value={form.valorAVencer} onChange={(value) => setForm({ ...form, valorAVencer: value })} />
              </div>
              <button onClick={simulate} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f755a] disabled:opacity-60">
                {busy ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {busy ? "Simulando..." : "Simular regras"}
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <ResultPanel result={result} readiness={readiness} />
          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Leitura da automação</h3>
            <div className="mt-4 space-y-3">
              <Signal icon={MessageCircle} title="Contato" active={Boolean(form.whatsapp || form.email)} description="Contato preenchido aumenta chance de ação imediata." />
              <Signal icon={Target} title="Intenção" active={form.respondeuContato || form.pediuPrecoOuDiagnostico} description="Resposta e pedido de preço aquecem o lead." />
              <Signal icon={Wallet} title="Histórico financeiro" active={form.valorPago > 0 || form.valorVencido > 0 || form.valorAVencer > 0} description="Valores mudam status e prioridade." />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Biblioteca de regras</h3>
            <p className="mt-1 text-sm text-slate-600">Resumo do que o CRM calcula automaticamente ao receber ou atualizar leads.</p>
          </div>
          <Badge tone="green">Ativo</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ruleCards.map((rule) => (
            <article key={rule.title} className="rounded-lg border border-[#dbe4e8] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-slate-50 p-2 text-[#138a6a]">
                  <rule.icon size={18} />
                </span>
                <div>
                  <Badge tone={rule.tone}>{rule.title}</Badge>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{rule.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ResultPanel({ result, readiness }: { result: Simulation | null; readiness: number }) {
  if (!result) {
    return (
      <EmptyState
        title="Resultado ainda não simulado"
        description={`O cenário está ${readiness}% completo. Clique em simular para ver score, temperatura, produto e próxima ação.`}
      />
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={temperatureTone(result.temperatura)}>{result.temperatura}</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[#0b2434]">Decisão recomendada</h3>
          <p className="mt-1 text-sm text-slate-600">{result.proximaAcao}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Score</p>
          <p className="text-4xl font-semibold text-[#0b2434]">{result.score}</p>
        </div>
      </div>
      <div className="mt-5 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-[#138a6a]" style={{ width: `${result.score}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="Produto sugerido" value={result.produtoSugerido} />
        <Result label="Status financeiro" value={result.statusFinanceiro} />
        <Result label="Temperatura" value={result.temperatura} badge />
        <Result label="Próxima ação" value={result.proximaAcao} />
      </div>
    </Card>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between gap-3 rounded-lg border border-[#dbe4e8] bg-white p-3 text-left hover:bg-slate-50">
      <span className="text-sm font-semibold text-[#0b2434]">{label}</span>
      <span className={`h-6 w-11 rounded-full p-1 transition ${checked ? "bg-[#138a6a]" : "bg-slate-200"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} className={inputClass} />
    </Field>
  );
}

function Signal({ icon: Icon, title, active, description }: { icon: React.ElementType; title: string; active: boolean; description: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
      <span className={`rounded-md p-2 ${active ? "bg-emerald-50 text-[#138a6a]" : "bg-white text-slate-400"}`}>
        <Icon size={17} />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#0b2434]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Result({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-2">{badge ? <Badge tone={temperatureTone(value)}>{value}</Badge> : <p className="font-semibold text-[#0b2434]">{value}</p>}</div>
    </div>
  );
}

function temperatureTone(value: string) {
  if (value === "Muito quente") return "red" as const;
  if (value === "Quente") return "amber" as const;
  if (value === "Morno") return "blue" as const;
  return "neutral" as const;
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
