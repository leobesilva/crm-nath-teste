"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "bootstrap") {
        const response = await fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, password }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível criar o primeiro acesso.");
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-[#10212b]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="hidden bg-[#0b2434] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">CRM</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">Estrada do Artista</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">Acesso protegido para operação comercial, campanhas, leads e integrações.</p>
          </div>
          <div className="grid max-w-3xl gap-3 md:grid-cols-3">
            {["Admin", "Gestor", "Usuário Básico"].map((role) => (
              <div key={role} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 font-semibold">{role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-[#dbe4e8] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-[#138a6a]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#0b2434]">{mode === "login" ? "Entrar no CRM" : "Criar primeiro Admin"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{mode === "login" ? "Use o e-mail e senha cadastrados no Supabase Auth." : "Use somente uma vez quando ainda não existir usuário no Supabase Auth."}</p>

            <div className="mt-5 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
              <button type="button" onClick={() => setMode("login")} className={`rounded px-3 py-2 ${mode === "login" ? "bg-white text-[#0b2434] shadow-sm" : "text-slate-600"}`}>Login</button>
              <button type="button" onClick={() => setMode("bootstrap")} className={`rounded px-3 py-2 ${mode === "bootstrap" ? "bg-white text-[#0b2434] shadow-sm" : "text-slate-600"}`}>Primeiro acesso</button>
            </div>

            <div className="mt-5 space-y-3">
              {mode === "bootstrap" ? (
                <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome do Admin" className="w-full rounded-md border border-[#c8d6dc] px-3 py-2 text-sm" />
              ) : null}
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="E-mail" className="w-full rounded-md border border-[#c8d6dc] px-3 py-2 text-sm" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Senha" className="w-full rounded-md border border-[#c8d6dc] px-3 py-2 text-sm" />
            </div>

            {message ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}

            <button disabled={loading} className="mt-5 w-full rounded-md bg-[#138a6a] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar e entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
