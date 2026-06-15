"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DORES_PRINCIPAIS, MOMENTOS_ARTISTICOS, ORIGENS_INICIAIS, PRODUTOS_INICIAIS } from "@/lib/constants";

export function NewLeadForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.consentimentoContato = formData.get("consentimentoContato") === "on" ? "true" : "";
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok || result.error) {
      setMessage(result.error || "Não foi possível salvar.");
      return;
    }
    if (result.data?.id) router.push(`/leads/${result.data.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <Field name="nome" label="Nome" required />
      <Field name="cpfCnpj" label="CPF/CNPJ" />
      <Field name="whatsapp" label="WhatsApp" />
      <Field name="email" label="E-mail" type="email" />
      <Field name="instagram" label="Instagram" />
      <Field name="cidade" label="Cidade" />
      <Field name="estado" label="Estado" />
      <Select name="origem" label="Origem" options={ORIGENS_INICIAIS} />
      <Select name="produtoInteresse" label="Produto de interesse" options={PRODUTOS_INICIAIS.map((item) => item.nome)} />
      <Select name="dorPrincipal" label="Dor principal" options={DORES_PRINCIPAIS} />
      <Select name="momentoArtistico" label="Momento artístico" options={MOMENTOS_ARTISTICOS} />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
        <input name="consentimentoContato" type="checkbox" className="h-4 w-4" />
        Consentimento de contato registrado
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
        <span>Observações</span>
        <textarea name="observacoes" className="min-h-28 w-full rounded-md border border-[#c8d6dc] px-3 py-2" />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button disabled={busy} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Salvando..." : "Salvar Lead"}</button>
        {message ? <p className="text-sm font-medium text-red-700">{message}</p> : null}
      </div>
    </form>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input name={name} type={type} required={required} className="w-full rounded-md border border-[#c8d6dc] px-3 py-2" placeholder={label} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select name={name} className="w-full rounded-md border border-[#c8d6dc] px-3 py-2">
        {options.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
}
