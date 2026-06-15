"use client";

import { useMemo, useState } from "react";
import { BadgeDollarSign, Boxes, CheckCircle2, Pencil, Plus, Repeat2, Search, Trash2, WalletCards, XCircle } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Product } from "@/lib/types";
import { Modal } from "@/components/modal";

type ProductForm = {
  nome: string;
  categoria: string;
  preco: number;
  recorrente: boolean;
  ativo: boolean;
};

const emptyForm: ProductForm = { nome: "", categoria: "Oferta", preco: 0, recorrente: false, ativo: true };
const modelFilters = ["Todos", "Recorrente", "Pontual"] as const;

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [model, setModel] = useState<(typeof modelFilters)[number]>("Todos");
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map((product) => product.categoria).filter(Boolean)))], [products]);
  const filtered = useMemo(() => {
    const needle = normalize(query);
    return products.filter((product) => {
      const matchesCategory = category === "Todas" || product.categoria === category;
      const matchesModel = model === "Todos" || (model === "Recorrente" ? product.recorrente : !product.recorrente);
      const haystack = normalize(`${product.nome} ${product.categoria}`);
      return matchesCategory && matchesModel && (!needle || haystack.includes(needle));
    });
  }, [products, query, category, model]);

  const totals = useMemo(
    () => ({
      active: products.filter((product) => product.ativo).length,
      recurring: products.filter((product) => product.recorrente).length,
      oneShot: products.filter((product) => !product.recorrente).length,
      averageTicket: products.length ? products.reduce((sum, product) => sum + product.preco, 0) / products.length : 0,
      highest: [...products].sort((a, b) => b.preco - a.preco)[0],
    }),
    [products],
  );

  function openCreate() {
    setEditingId(null);
    setDeleteId(null);
    setForm(emptyForm);
    setMessage("");
    setFormOpen(true);
  }

  function edit(product: Product) {
    setEditingId(product.id);
    setFormOpen(true);
    setDeleteId(null);
    setMessage("");
    setForm({ nome: product.nome, categoria: product.categoria, preco: product.preco, recorrente: product.recorrente, ativo: product.ativo });
  }

  async function save() {
    if (!form.nome.trim()) {
      setMessage("Informe o nome da oferta.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/products", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...form }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Não foi possível salvar.");
      return;
    }
    setProducts((current) => [payload.data, ...current.filter((product) => product.id !== payload.data.id)]);
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setMessage(editingId ? "Oferta atualizada." : "Oferta criada.");
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Não foi possível excluir.");
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== id));
    setDeleteId(null);
    setMessage("Oferta excluída.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="green">{totals.active} oferta(s) ativa(s)</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Escada comercial</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Organize diagnóstico, comunidade, premium e projetos para que leads, campanhas e vendas usem o mesmo catálogo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Ticket médio" value={money(totals.averageTicket)} icon={BadgeDollarSign} />
            <HeroMetric label="Oferta maior" value={totals.highest ? money(totals.highest.preco) : money(0)} icon={WalletCards} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ofertas" value={String(products.length)} icon={Boxes} tone="blue" />
        <MetricCard label="Recorrentes" value={String(totals.recurring)} icon={Repeat2} tone="green" />
        <MetricCard label="Pontuais" value={String(totals.oneShot)} icon={WalletCards} tone="amber" />
        <MetricCard label="Categorias" value={String(Math.max(categories.length - 1, 0))} icon={CheckCircle2} tone="green" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Catálogo de ofertas</h3>
            <p className="mt-1 text-sm text-slate-600">Busque, filtre e edite a oferta sem sair desta página.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <Plus size={16} />
            Nova oferta
          </button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-[#0f755a]">{message}</p> : null}
        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar oferta ou categoria..."
              className="w-full rounded-md border border-[#c8d6dc] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${category === item ? "bg-[#138a6a] text-white" : "border border-[#dbe4e8] bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {modelFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setModel(item)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${model === item ? "bg-[#0b2434] text-white" : "border border-[#dbe4e8] bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              confirmingDelete={deleteId === product.id}
              busy={busy}
              onEdit={() => edit(product)}
              onAskDelete={() => setDeleteId(product.id)}
              onCancelDelete={() => setDeleteId(null)}
              onDelete={() => remove(product.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma oferta encontrada" description="Ajuste a busca, categoria ou modelo comercial para visualizar o catálogo." />
      )}

      <Modal
        open={formOpen}
        title={editingId ? "Editar oferta" : "Nova oferta"}
        description="Defina nome, categoria, preço, recorrência e status da oferta comercial."
        onClose={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }}
        size="lg"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome">
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Categoria">
            <input value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Preço">
            <input value={form.preco} onChange={(event) => setForm({ ...form, preco: Number(event.target.value) })} type="number" min="0" step="0.01" className={inputClass} />
          </Field>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[#0b2434]">Modelo</span>
            <button type="button" onClick={() => setForm({ ...form, recorrente: !form.recorrente })} className="flex items-center justify-between rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
              {form.recorrente ? "Recorrente" : "Pontual"}
              <span className={`h-6 w-11 rounded-full p-1 transition ${form.recorrente ? "bg-[#138a6a]" : "bg-slate-200"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${form.recorrente ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </div>
          <div className="md:col-span-2">
            <button type="button" onClick={() => setForm({ ...form, ativo: !form.ativo })} className="flex w-full items-center justify-between rounded-lg border border-[#dbe4e8] bg-slate-50 p-3 text-left">
              <span>
                <span className="block text-sm font-semibold text-[#0b2434]">Oferta ativa</span>
                <span className="mt-1 block text-xs text-slate-600">Ofertas inativas ficam preparadas para sair do catálogo quando a API permitir listagem histórica.</span>
              </span>
              {form.ativo ? <CheckCircle2 className="text-[#138a6a]" size={20} /> : <XCircle className="text-slate-400" size={20} />}
            </button>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
            Cancelar
          </button>
          <button disabled={busy || !form.nome.trim()} onClick={save} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">
            {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Criar oferta"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ProductCard({
  product,
  confirmingDelete,
  busy,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  product: Product;
  confirmingDelete: boolean;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex min-h-[260px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <Badge tone="green">{product.categoria}</Badge>
        <Badge tone={product.recorrente ? "blue" : "neutral"}>{product.recorrente ? "Recorrente" : "Pontual"}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-[#0b2434]">{product.nome}</h3>
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Preço</p>
        <p className="mt-1 text-3xl font-semibold text-[#0b2434]">{money(product.preco)}</p>
        <p className="mt-1 text-xs text-slate-500">{product.recorrente ? "Modelo recorrente para MRR" : "Oferta pontual"}</p>
      </div>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
            <Pencil size={16} />
            Editar
          </button>
          <button onClick={onAskDelete} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
        {confirmingDelete ? (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Excluir esta oferta?</p>
            <p className="mt-1 text-xs leading-5">No banco real ela será desativada com segurança.</p>
            <div className="mt-3 flex gap-2">
              <button disabled={busy} onClick={onDelete} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Confirmar</button>
              <button onClick={onCancelDelete} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Cancelar</button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
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

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
