"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";

export function MergeLeadForm({ targetLeadId, candidates }: { targetLeadId: string; candidates: Lead[] }) {
  const [sourceLeadId, setSourceLeadId] = useState(candidates[0]?.id ?? "");
  const [message, setMessage] = useState("");

  async function merge() {
    if (!sourceLeadId) return;
    const response = await fetch(`/api/leads/${targetLeadId}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceLeadId }),
    });
    const payload = await response.json();
    setMessage(payload.status === "merged" ? "Mescla concluída com histórico e tarefas preservados." : payload.error || "Não foi possível mesclar.");
  }

  if (!candidates.length) {
    return <p className="mt-3 text-sm text-slate-600">Nenhum outro lead disponível para mescla.</p>;
  }

  return (
    <div className="mt-4 rounded-md bg-slate-50 p-3">
      <p className="text-sm font-semibold text-[#0b2434]">Mesclar duplicado</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select value={sourceLeadId} onChange={(event) => setSourceLeadId(event.target.value)} className="min-w-0 flex-1 rounded-md border border-[#c8d6dc] px-3 py-2 text-sm">
          {candidates.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome}</option>)}
        </select>
        <button onClick={merge} className="rounded-md bg-[#0b2434] px-4 py-2 text-sm font-semibold text-white">Mesclar</button>
      </div>
      {message ? <p className="mt-2 text-sm text-[#138a6a]">{message}</p> : null}
    </div>
  );
}
