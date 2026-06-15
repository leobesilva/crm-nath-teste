"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Flame,
  MessageCircle,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, EmptyState } from "@/components/ui";
import { DashboardData } from "@/lib/types";

const palette = ["#138a6a", "#0b5470", "#f59e0b", "#64748b", "#ef4444", "#22c55e"];
const views = ["executivo", "funil", "campanhas"] as const;

type View = (typeof views)[number];

export function DashboardClient({ data }: { data: DashboardData }) {
  const [view, setView] = useState<View>("executivo");

  const insight = useMemo(() => buildInsight(data), [data]);
  const topCampaigns = useMemo(() => [...(data.campaigns ?? [])].sort((a, b) => b.receita - a.receita).slice(0, 3), [data.campaigns]);
  const topOrigin = useMemo(() => [...data.origins].sort((a, b) => b.total - a.total)[0], [data.origins]);
  const executiveMetrics = [
    { label: "Leads", metric: findMetric(data, "Total de leads"), icon: Users, tone: "blue" as const },
    { label: "Vendas", metric: findMetric(data, "Vendas realizadas"), icon: Target, tone: "green" as const },
    { label: "Receita paga", metric: findMetric(data, "Receita paga"), icon: Wallet, tone: "green" as const },
    { label: "Receita vencida", metric: findMetric(data, "Receita vencida"), icon: AlertTriangle, tone: "red" as const },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[#0b2434] bg-[#0b2434] text-white shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1.5fr_1fr] lg:p-6">
          <div className="min-w-0">
            <Badge tone={insight.tone}>{insight.badge}</Badge>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">{insight.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{insight.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={insight.href}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0b2434] transition hover:bg-emerald-50"
              >
                {insight.cta}
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/leads"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver leads
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {executiveMetrics.map(({ label, metric, icon: Icon, tone }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-200">{label}</span>
                  <span className="rounded-md bg-white/10 p-2">
                    <Icon size={17} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{metric?.value ?? "0"}</p>
                {metric?.hint ? <p className="mt-1 text-xs text-slate-300">{metric.hint}</p> : <p className="mt-1 text-xs text-slate-300">{toneLabel(tone)}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#0b2434]">Central de decisao</h3>
          <p className="text-sm text-slate-600">Use esta visao para priorizar follow-up, campanha, receita e pipeline.</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#dbe4e8] bg-white p-1 shadow-sm">
          {views.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
                view === item ? "bg-[#138a6a] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {view === "executivo" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DecisionCard
              icon={MessageCircle}
              title="Follow-up comercial"
              value={findMetric(data, "Propostas")?.value ?? "0"}
              description="Propostas abertas pedem retorno com contexto e urgencia."
              href="/tarefas"
            />
            <DecisionCard
              icon={ClipboardList}
              title="Diagnosticos"
              value={findMetric(data, "Diagnost")?.value ?? "0"}
              description="Agenda comercial pronta para confirmar, conduzir e registrar."
              href="/tarefas"
            />
            <DecisionCard
              icon={Flame}
              title="Leads quentes"
              value={findTemperature(data, "quente")?.total.toString() ?? "0"}
              description="Priorize conversas com maior intencao de compra."
              href="/leads?temperatura=Quente"
            />
            <DecisionCard
              icon={BarChart3}
              title="Origem lider"
              value={topOrigin?.origem ?? "Sem dados"}
              description={topOrigin ? `${topOrigin.total} lead(s) chegaram por esta via.` : "Conecte canais para enxergar a tracao."}
              href="/integracoes"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0b2434]">Receita paga x vencida</h3>
                  <p className="text-sm text-slate-600">Leitura rapida do caixa comercial por mes.</p>
                </div>
                <Badge tone="green">{findMetric(data, "MRR")?.value ?? "MRR indisponivel"}</Badge>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => shortMoney(Number(value))} />
                    <Tooltip formatter={(value) => money(Number(value))} />
                    <Line type="monotone" dataKey="paga" name="Paga" stroke="#138a6a" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="vencida" name="Vencida" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-[#0b2434]">Temperatura da base</h3>
              <p className="mb-4 text-sm text-slate-600">Ajuda a separar prioridade real de volume bruto.</p>
              <div className="space-y-3">
                {data.temperatures.map((item, index) => (
                  <ProgressRow key={item.temperatura} label={item.temperatura} value={item.total} max={maxValue(data.temperatures.map((temp) => temp.total))} color={palette[index % palette.length]} />
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {view === "funil" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0b2434]">Funil por etapa</h3>
                  <p className="text-sm text-slate-600">Onde os leads estao concentrados e onde o time precisa destravar.</p>
                </div>
                <Link href="/pipeline" className="inline-flex items-center gap-1 text-sm font-semibold text-[#138a6a]">
                  Abrir pipeline <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.funnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={72} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Leads" fill="#138a6a" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-[#0b2434]">Conversao por etapa</h3>
              <p className="mb-4 text-sm text-slate-600">Taxas para identificar gargalos de passagem.</p>
              <div className="space-y-3">
                {(data.conversions ?? []).length ? (
                  data.conversions?.map((item) => (
                    <div key={item.etapa} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm text-slate-600">{item.etapa}</p>
                      <p className="mt-1 text-xl font-semibold text-[#0b2434]">{item.taxa}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Sem conversoes ainda" description="Quando houver movimentos no pipeline, as taxas aparecem aqui." />
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="text-base font-semibold text-[#0b2434]">Motivos de perda</h3>
              <p className="mb-4 text-sm text-slate-600">Principais objeções para ajustar oferta, abordagem e campanha.</p>
              <div className="space-y-3">
                {data.losses.length ? data.losses.map((item) => <ProgressRow key={item.motivo} label={item.motivo} value={item.total} max={maxValue(data.losses.map((loss) => loss.total))} color="#ef4444" />) : <EmptyState title="Sem perdas registradas" description="Marque perdas no lead para acompanhar padroes de objeção." />}
              </div>
            </Card>
            <Card>
              <h3 className="text-base font-semibold text-[#0b2434]">Leads por origem</h3>
              <p className="mb-4 text-sm text-slate-600">Distribuicao de entrada para comparar canais.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.origins} dataKey="total" nameKey="origem" outerRadius={86} innerRadius={42} paddingAngle={3}>
                      {data.origins.map((_, index) => (
                        <Cell key={index} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {view === "campanhas" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0b2434]">Performance por campanha</h3>
                  <p className="text-sm text-slate-600">Campanhas em cards para comparar retorno sem rolagem lateral.</p>
                </div>
                <Link href="/campanhas" className="inline-flex items-center gap-1 text-sm font-semibold text-[#138a6a]">
                  Gerenciar <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(data.campaigns ?? []).length ? (
                  data.campaigns?.map((campaign) => (
                    <article key={campaign.nome} className="rounded-lg border border-[#dbe4e8] bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-[#0b2434]">{campaign.nome}</h4>
                          <p className="text-xs text-slate-500">{campaign.origem}</p>
                        </div>
                        <Badge tone={campaign.vendas > 0 ? "green" : "amber"}>{campaign.conversao}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <MiniMetric label="Receita" value={money(campaign.receita)} />
                        <MiniMetric label="Invest." value={money(campaign.investimento)} />
                        <MiniMetric label="Leads" value={campaign.leads.toString()} />
                        <MiniMetric label="CAC" value={campaign.cac} />
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState title="Campanhas sem dados" description="Vincule origens e investimentos para enxergar CAC, conversao e receita por campanha." />
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-[#0b2434]">Top campanhas</h3>
              <p className="mb-4 text-sm text-slate-600">Melhores retornos por receita registrada.</p>
              <div className="space-y-3">
                {topCampaigns.length ? (
                  topCampaigns.map((campaign, index) => (
                    <div key={campaign.nome} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0b2434]">{index + 1}. {campaign.nome}</p>
                        <p className="text-xs text-slate-500">{campaign.vendas} venda(s)</p>
                      </div>
                      <strong className="text-sm text-[#138a6a]">{money(campaign.receita)}</strong>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Sem ranking" description="O ranking aparece quando campanhas gerarem receita." />
                )}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Vendas por produto</h3>
            <p className="mb-4 text-sm text-slate-600">Quais ofertas estao puxando receita dentro do CRM.</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(data.productSales ?? []).length ? (
                data.productSales?.map((item) => (
                  <article key={item.produto} className="rounded-lg border border-[#dbe4e8] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="min-w-0 truncate text-sm font-semibold text-[#0b2434]">{item.produto}</h4>
                      <Badge tone="green">{item.vendas} venda(s)</Badge>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-[#138a6a]">{money(item.receita)}</p>
                    <p className="text-xs text-slate-500">em receita paga</p>
                  </article>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3">
                  <EmptyState title="Produtos sem vendas" description="Quando oportunidades forem marcadas como ganhas, a receita por produto aparece aqui." />
                </div>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function DecisionCard({ icon: Icon, title, value, description, href }: { icon: React.ElementType; title: string; value: string; description: string; href: string }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-md bg-emerald-50 p-2 text-[#138a6a]">
          <Icon size={18} />
        </div>
        <Link href={href} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#0b2434]" aria-label={`Abrir ${title}`}>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-[#0b2434]">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#0b2434]">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-slate-700">{label}</span>
        <span className="font-semibold text-[#0b2434]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full" style={{ width: `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`, background: color }} />
      </div>
    </div>
  );
}

function buildInsight(data: DashboardData) {
  const overdue = numericValue(findMetric(data, "Receita vencida")?.value);
  const diagnostics = numericValue(findMetric(data, "Diagnost")?.value);
  const proposals = numericValue(findMetric(data, "Propostas")?.value);
  const totalLeads = numericValue(findMetric(data, "Total de leads")?.value);

  if (overdue > 0) {
    return {
      badge: "Atenção financeira",
      title: "Existe receita vencida pedindo ação hoje.",
      description: "Priorize cobrança humanizada e registro de retorno para proteger caixa e evitar perda de relacionamento.",
      cta: "Ver tarefas",
      href: "/tarefas",
      tone: "red" as const,
    };
  }

  if (diagnostics > 0) {
    return {
      badge: "Agenda ativa",
      title: "Diagnosticos agendados podem virar oportunidade.",
      description: "Confirme presenca, prepare contexto do lead e registre a proxima acao logo apos a conversa.",
      cta: "Abrir agenda",
      href: "/tarefas",
      tone: "blue" as const,
    };
  }

  if (proposals > 0) {
    return {
      badge: "Follow-up",
      title: "Propostas abertas precisam de cadencia comercial.",
      description: "Use o CRM para concentrar retorno, objeções e decisão de compra sem perder tempo entre telas.",
      cta: "Ver pipeline",
      href: "/pipeline",
      tone: "amber" as const,
    };
  }

  return {
    badge: totalLeads > 0 ? "Base pronta" : "Comece pelas entradas",
    title: totalLeads > 0 ? "A base ja tem material para qualificar e priorizar." : "Conecte canais e importe leads para acender o painel.",
    description: totalLeads > 0 ? "Filtre leads quentes, organize tarefas e avance etapas para transformar volume em receita." : "WhatsApp, Instagram, forms e paginas de venda podem alimentar o mesmo banco de leads.",
    cta: totalLeads > 0 ? "Qualificar leads" : "Configurar integrações",
    href: totalLeads > 0 ? "/leads" : "/integracoes",
    tone: "green" as const,
  };
}

function findMetric(data: DashboardData, labelFragment: string) {
  const needle = normalize(labelFragment);
  return data.metrics.find((metric) => normalize(metric.label).includes(needle));
}

function findTemperature(data: DashboardData, labelFragment: string) {
  const needle = normalize(labelFragment);
  return data.temperatures.find((item) => normalize(item.temperatura).includes(needle));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function numericValue(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function shortMoney(value: number) {
  if (value >= 1000) return `R$ ${Math.round(value / 1000)}k`;
  return `R$ ${value}`;
}

function toneLabel(tone: "blue" | "green" | "red") {
  const labels = {
    blue: "Volume comercial",
    green: "Resultado",
    red: "Ponto de atenção",
  };
  return labels[tone];
}
