"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lead } from "@/lib/types";

export function LeadActionsClient({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<"won" | "lost" | null>(null);
  const [produto, setProduto] = useState(lead.produtoInteresse || "");
  const [motivoPerda, setMotivoPerda] = useState("");

  async function patch(label: string, body: Record<string, unknown>) {
    setBusy(label);
    setMessage("");
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await finish(response, "Lead atualizado.");
  }

  async function markWon() {
    if (!produto.trim()) {
      setMessage("Informe o produto vendido.");
      return;
    }
    setBusy("Venda");
    const response = await fetch(`/api/leads/${lead.id}/mark-won`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoInteresse: produto }),
    });
    await finish(response, "Venda registrada.");
  }

  async function markLost() {
    if (!motivoPerda.trim()) {
      setMessage("Informe o motivo da perda.");
      return;
    }
    setBusy("Perda");
    const response = await fetch(`/api/leads/${lead.id}/mark-lost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivoPerda }),
    });
    await finish(response, "Perda registrada.");
  }

  async function finish(response: Response, successMessage: string) {
    const payload = await response.json();
    setBusy(null);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Ação não concluída.");
      return;
    }
    setPanel(null);
    setMessage(successMessage);
    router.refresh();
  }

  const buttonClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm font-semibold text-[#0b2434] disabled:opacity-60 hover:bg-slate-50";

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <button disabled={!!busy} onClick={() => patch("Diagnóstico", { etapaFunil: "Diagnóstico Agendado", statusComercial: "Diagnóstico Agendado" })} className={buttonClass}>Enviar para diagnóstico</button>
        <button disabled={!!busy} onClick={() => setPanel(panel === "won" ? null : "won")} className={buttonClass}>Marcar venda</button>
        <button disabled={!!busy} onClick={() => setPanel(panel === "lost" ? null : "lost")} className={buttonClass}>Marcar perda</button>
        <button disabled={!!busy} onClick={() => patch("Reativar", { etapaFunil: "Novo Lead", statusComercial: "Novo Lead", motivoPerda: null })} className={buttonClass}>Reativar</button>
      </div>

      {panel === "won" ? (
        <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">Registrar venda realizada</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input value={produto} onChange={(event) => setProduto(event.target.value)} placeholder="Produto vendido" className="rounded-md border border-emerald-200 px-3 py-2 text-sm sm:flex-1" />
            <button disabled={!!busy} onClick={markWon} className="rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white">Confirmar</button>
          </div>
        </div>
      ) : null}

      {panel === "lost" ? (
        <div className="mt-3 rounded-md border border-red-100 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-900">Registrar perda</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input value={motivoPerda} onChange={(event) => setMotivoPerda(event.target.value)} placeholder="Motivo da perda" className="rounded-md border border-red-200 px-3 py-2 text-sm sm:flex-1" />
            <button disabled={!!busy} onClick={markLost} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">Confirmar</button>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm font-medium text-[#138a6a]">{busy ? "Processando..." : message}</p> : null}
    </div>
  );
}
