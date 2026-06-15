"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, RefreshCw, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { USER_ROLES, AuthProfile, UserRole } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { Modal } from "@/components/modal";
import { authHeaders } from "@/lib/headers";

const emptyUserForm = {
  nome: "",
  email: "",
  password: "",
  role: "Usuario Basico" as UserRole,
};

const roleDescriptions: Record<UserRole, string> = {
  Admin: "Acesso total, usuários, exportações, LGPD e configurações.",
  Gestor: "Opera integrações, campanhas, produtos, leads e pipeline.",
  "Usuario Basico": "Consulta leads, tarefas, pipeline e histórico.",
};

export function UsersClient() {
  const { session, profile } = useAuth();
  const [users, setUsers] = useState<AuthProfile[]>([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyUserForm);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => ({
      loaded: users.length,
      active: users.filter((user) => user.ativo).length,
      admins: users.filter((user) => user.role === "Admin").length,
    }),
    [users],
  );

  async function fetchUsers() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/users", {
      headers: authHeaders(session?.access_token),
    });
    const payload = await response.json();
    setLoading(false);
    if (response.ok) {
      setUsers(payload.data);
      setMessage(payload.data.length ? "Usuários carregados." : "Nenhum usuário retornado pelo banco.");
      return;
    }
    setMessage(payload.error || "Não foi possível carregar usuários.");
  }

  async function createUser() {
    setMessage("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(session?.access_token) },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível criar o usuário.");
      return;
    }
    setUsers((current) => [payload.data, ...current.filter((user) => user.id !== payload.data.id)]);
    setForm(emptyUserForm);
    setOpen(false);
    setMessage("Usuário criado.");
  }

  async function updateUser(id: string, input: Partial<Pick<AuthProfile, "role" | "ativo">>) {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(session?.access_token) },
      body: JSON.stringify({ id, ...input }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível atualizar.");
      return;
    }
    setUsers((current) => current.map((user) => (user.id === id ? payload.data : user)));
    setMessage("Acesso atualizado.");
  }

  if (profile?.role !== "Admin") {
    return (
      <Card className="mt-5">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-amber-50 p-2 text-amber-700">
            <ShieldOff size={18} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Usuários e acessos</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Somente Admin pode criar usuários e alterar perfis.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Usuários e acessos</h3>
            <p className="mt-1 text-sm text-slate-600">Crie acessos no Supabase Auth e defina o perfil operacional no CRM.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchUsers} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
              Carregar usuários
            </button>
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#138a6a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
              <Plus size={16} />
              Novo usuário
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-[#0f755a]">{message}</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <AccessMetric label="Carregados" value={totals.loaded} icon={UserRound} />
          <AccessMetric label="Ativos" value={totals.active} icon={CheckCircle2} />
          <AccessMetric label="Admins" value={totals.admins} icon={ShieldCheck} />
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {USER_ROLES.map((role) => (
          <Card key={role}>
            <Badge tone={role === "Admin" ? "green" : role === "Gestor" ? "blue" : "neutral"}>{displayRole(role)}</Badge>
            <p className="mt-3 text-sm leading-6 text-slate-600">{roleDescriptions[role]}</p>
          </Card>
        ))}
      </div>

      {users.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <UserCard key={user.id} user={user} onUpdate={updateUser} />
          ))}
        </div>
      ) : (
        <EmptyState title="Usuários ainda não carregados" description="Clique em carregar usuários para buscar perfis do banco e gerenciar acessos." />
      )}

      <Modal open={open} title="Novo usuário" description="Crie um acesso no Supabase Auth e defina o perfil operacional." onClose={() => setOpen(false)} size="lg">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome">
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} />
          </Field>
          <Field label="E-mail">
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" className={inputClass} />
          </Field>
          <Field label="Senha">
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" className={inputClass} />
          </Field>
          <Field label="Perfil">
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className={inputClass}>
              {USER_ROLES.map((role) => <option key={role} value={role}>{displayRole(role)}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">Cancelar</button>
          <button disabled={!form.nome || !form.email || !form.password} onClick={createUser} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a] disabled:opacity-60">Criar usuário</button>
        </div>
      </Modal>
    </div>
  );
}

function UserCard({ user, onUpdate }: { user: AuthProfile; onUpdate: (id: string, input: Partial<Pick<AuthProfile, "role" | "ativo">>) => void }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate font-semibold text-[#0b2434]">{user.nome}</h4>
            <Badge tone={user.ativo ? "green" : "red"}>{user.ativo ? "Ativo" : "Inativo"}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
        </div>
        <button onClick={() => onUpdate(user.id, { ativo: !user.ativo })} className="rounded-md border border-[#c8d6dc] px-3 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
          {user.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-[#0b2434]">Perfil operacional</span>
          <select value={user.role} onChange={(event) => onUpdate(user.id, { role: event.target.value as UserRole })} className={inputClass}>
            {USER_ROLES.map((role) => <option key={role} value={role}>{displayRole(role)}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs leading-5 text-slate-600">{roleDescriptions[user.role]}</p>
      </div>
    </Card>
  );
}

function AccessMetric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <Icon className="text-slate-400" size={18} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#0b2434]">{value}</p>
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

function displayRole(role: UserRole) {
  return role === "Usuario Basico" ? "Usuário Básico" : role;
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
