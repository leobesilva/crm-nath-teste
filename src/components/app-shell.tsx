"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  ClipboardList,
  Database,
  FileUp,
  Flag,
  LogOut,
  Plug,
  LayoutDashboard,
  ListChecks,
  Settings,
  Table2,
  Users,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { visibleRoutes } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads / CRM", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Table2 },
  { href: "/importacao", label: "Importação", icon: FileUp },
  { href: "/entrada-bruta", label: "Entrada bruta", icon: Database },
  { href: "/automacoes", label: "Automações", icon: Bot },
  { href: "/campanhas", label: "Campanhas", icon: Flag },
  { href: "/produtos", label: "Produtos", icon: Boxes },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/historico", label: "Histórico", icon: ClipboardList },
  { href: "/integracoes", label: "Integrações", icon: Plug },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AuthProvider>
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading, signOut } = useAuth();
  const isLoginRoute = pathname?.startsWith("/login");

  if (isLoginRoute) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f8] text-[#0b2434]">
        <div className="rounded-lg border border-[#dbe4e8] bg-white px-6 py-5 text-sm shadow-sm">Carregando acesso...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f8] px-4 text-[#0b2434]">
        <div className="w-full max-w-md rounded-lg border border-[#dbe4e8] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Acesso não carregado</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Não foi possível confirmar seu perfil no CRM. Entre novamente ou verifique a configuração do Supabase e do banco.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/login" className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
              Ir para login
            </Link>
            <button onClick={signOut} className="rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
              Limpar sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  const visible = visibleRoutes(profile.role);
  const items = visible === "all" ? navItems : navItems.filter((item) => visible.has(item.href));

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#10212b]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#dbe4e8] bg-[#0b2434] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-200">CRM</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight">Estrada do Artista</h1>
            <p className="mt-2 text-sm text-slate-300">Direção artística contínua</p>
          </div>
          <nav className="crm-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/15 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-white/10 p-4 text-xs text-slate-300">
            <div>
              <p className="font-semibold text-white">{profile.nome}</p>
              <p className="truncate">{profile.email}</p>
              <p className="mt-1">Perfil: <span className="font-semibold text-white">{profile.role}</span></p>
            </div>
            <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 font-semibold text-white hover:bg-white/10">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#dbe4e8] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#138a6a]">CRM</p>
              <p className="font-semibold">Estrada do Artista</p>
              <p className="text-xs text-slate-500">{profile.role}</p>
            </div>
            <button onClick={signOut} className="rounded-md border border-[#dbe4e8] p-2 text-[#0b2434]">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div className="crm-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {items.slice(0, 8).map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md border border-[#dbe4e8] px-3 py-1.5 text-xs font-medium">
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
