"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, ListChecks, Plus, RefreshCw, Search, UserRound, XCircle } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Lead, Task } from "@/lib/types";
import { TIPOS_TAREFA } from "@/lib/constants";
import { Modal } from "@/components/modal";

const statusFilters = ["Todas", "Atrasadas", "Hoje", "Pendentes", "Concluídas"] as const;

type StatusFilter = (typeof statusFilters)[number];

export function TasksClient({ initialTasks, leads }: { initialTasks: Task[]; leads: Lead[] }) {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId") || leads[0]?.id || "";
  const [tasks, setTasks] = useState(initialTasks);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Todas");
  const [type, setType] = useState("Todos");
  const [form, setForm] = useState(() => ({
    leadId: initialLeadId,
    titulo: "",
    descricao: "",
    tipo: "Follow-up",
    dataVencimento: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  }));

  const stats = useMemo(() => {
    const openTasks = tasks.filter((task) => !isDone(task));
    return {
      total: tasks.length,
      overdue: openTasks.filter(isOverdue).length,
      today: openTasks.filter(isToday).length,
      pending: openTasks.length,
      done: tasks.filter(isDone).length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return tasks
      .filter((task) => {
        const matchesStatus =
          status === "Todas" ||
          (status === "Atrasadas" && !isDone(task) && isOverdue(task)) ||
          (status === "Hoje" && !isDone(task) && isToday(task)) ||
          (status === "Pendentes" && !isDone(task)) ||
          (status === "Concluídas" && isDone(task));
        const matchesType = type === "Todos" || task.tipo === type;
        const haystack = normalize([task.titulo, task.leadNome, task.tipo, task.responsavel, task.descricao].filter(Boolean).join(" "));
        return matchesStatus && matchesType && (!needle || haystack.includes(needle));
      })
      .sort(compareTasks);
  }, [tasks, query, status, type]);

  async function createTask() {
    if (!form.leadId || !form.titulo.trim()) return;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dataVencimento: new Date(form.dataVencimento).toISOString() }),
    });
    const payload = await response.json();
    setTasks((current) => [payload.data, ...current]);
    setForm((current) => ({ ...current, titulo: "", descricao: "" }));
    setOpen(false);
  }

  async function updateTask(id: string, nextStatus: string) {
    setBusyId(id);
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = await response.json();
    setTasks((current) => current.map((task) => (task.id === id ? payload.data : task)));
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#0b2434] bg-[#0b2434] p-5 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
          <div>
            <Badge tone={stats.overdue ? "red" : stats.today ? "amber" : "green"}>{stats.overdue ? "Ação urgente" : stats.today ? "Agenda do dia" : "Agenda organizada"}</Badge>
            <h3 className="mt-4 text-2xl font-semibold">Mesa de follow-up comercial</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Priorize retornos, diagnósticos, cobranças e reativações por vencimento para manter o relacionamento andando.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Atrasadas" value={String(stats.overdue)} icon={XCircle} />
            <HeroMetric label="Para hoje" value={String(stats.today)} icon={CalendarClock} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pendentes" value={String(stats.pending)} icon={Clock3} tone="blue" />
        <MetricCard label="Atrasadas" value={String(stats.overdue)} icon={XCircle} tone="red" />
        <MetricCard label="Concluídas" value={String(stats.done)} icon={CheckCircle2} tone="green" />
        <MetricCard label="Total" value={String(stats.total)} icon={ListChecks} tone="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Agenda comercial</h3>
            <p className="mt-1 text-sm text-slate-600">Filtre por prioridade e resolva tarefas sem abrir uma tabela pesada.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <Plus size={16} />
            Nova tarefa
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar tarefa, lead ou responsável..."
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["Todos", ...TIPOS_TAREFA].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${type === item ? "bg-[#0b2434] text-white" : "border border-[#dbe4e8] bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} busy={busyId === task.id} onUpdate={updateTask} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma tarefa encontrada" description="Ajuste filtros ou crie uma nova tarefa para organizar o próximo contato." />
      )}

      <Modal open={open} title="Nova tarefa" description="Defina lead, tipo e vencimento para orientar a próxima ação." onClose={() => setOpen(false)} size="lg">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Lead">
            <select value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })} className={inputClass}>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome}</option>)}
            </select>
          </Field>
          <Field label="Título">
            <input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Tipo">
            <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className={inputClass}>
              {TIPOS_TAREFA.map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
          </Field>
          <Field label="Vencimento">
            <input value={form.dataVencimento} onChange={(event) => setForm({ ...form, dataVencimento: event.target.value })} type="datetime-local" className={inputClass} />
          </Field>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-semibold text-[#0b2434]">Descrição</span>
            <textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} rows={3} className={inputClass} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">Cancelar</button>
          <button disabled={!form.leadId || !form.titulo.trim()} onClick={createTask} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">Criar tarefa</button>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({ task, busy, onUpdate }: { task: Task; busy: boolean; onUpdate: (id: string, status: string) => void }) {
  const done = isDone(task);
  const overdue = !done && isOverdue(task);
  const today = !done && isToday(task);
  const status = done ? "Concluída" : overdue ? "Atrasada" : today ? "Hoje" : task.status;

  return (
    <article className={`rounded-lg border bg-white p-4 shadow-sm ${overdue ? "border-red-200" : today ? "border-amber-200" : "border-[#dbe4e8]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(status)}>{status}</Badge>
            <Badge tone="blue">{task.tipo}</Badge>
          </div>
          <h4 className="mt-3 text-lg font-semibold leading-snug text-[#0b2434]">{task.titulo}</h4>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <UserRound size={15} />
            {task.leadNome}
          </p>
        </div>
        <Link href={`/leads/${task.leadId}`} className="rounded-md p-2 text-[#138a6a] hover:bg-emerald-50" aria-label="Abrir lead">
          <ArrowUpRight size={18} />
        </Link>
      </div>

      {task.descricao ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{task.descricao}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Detail label="Vencimento" value={formatDateTime(task.dataVencimento)} />
        <Detail label="Responsável" value={task.responsavel || "Comercial"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={busy || done}
          onClick={() => onUpdate(task.id, "Concluída")}
          className="inline-flex items-center gap-2 rounded-md bg-[#138a6a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
          Concluir
        </button>
        <button
          disabled={busy || !done}
          onClick={() => onUpdate(task.id, "Pendente")}
          className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Reabrir
        </button>
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
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: "blue" | "green" | "amber" | "red" }) {
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0b2434]">{value}</p>
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

function isDone(task: Task) {
  return task.status === "Concluída";
}

function isOverdue(task: Task) {
  return new Date(task.dataVencimento).getTime() < startOfToday().getTime();
}

function isToday(task: Task) {
  const date = new Date(task.dataVencimento);
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return date >= start && date < end;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function compareTasks(a: Task, b: Task) {
  if (isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1;
  if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
  return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
}

function statusTone(status: string) {
  if (status === "Concluída") return "green" as const;
  if (status === "Atrasada") return "red" as const;
  if (status === "Hoje") return "amber" as const;
  return "blue" as const;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
