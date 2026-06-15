"use client";

import { useState } from "react";
import { Download, Eraser, FileDown, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AuditLog, Lead } from "@/lib/types";

export function LgpdClient({ leads, initialLogs }: { leads: Lead[]; initialLogs: AuditLog[] }) {
  const [items, setItems] = useState(leads);
  const [logs, setLogs] = useState(initialLogs);
  const [role, setRole] = useState("Admin");
  const [message, setMessage] = useState("");

  async function runAction(id: string, action: "anonymize" | "soft-delete") {
    const response = await fetch(`/api/leads/${id}/lgpd`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-crm-role": role },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Ação não permitida.");
      return;
    }
    setItems((current) => current.map((lead) => (lead.id === id ? payload.data : lead)));
    const auditResponse = await fetch("/api/audit-logs");
    const auditPayload = await auditResponse.json();
    setLogs(auditPayload.data);
    setMessage(action === "anonymize" ? "Lead anonimizado." : "Lead excluído logicamente.");
  }

  async function exportLeads(format: "csv" | "xlsx") {
    const response = await fetch(`/api/leads/export?format=${format}`, { headers: { "x-crm-role": role } });
    if (!response.ok) {
      const payload = await response.json();
      setMessage(payload.error);
      return;
    }
    setMessage(`Exportação ${format.toUpperCase()} autorizada para ${role}.`);
  }

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 p-2 text-[#138a6a]">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#0b2434]">LGPD e permissões</h3>
                <p className="mt-1 text-sm text-slate-600">Exportação e ações sensíveis restritas ao perfil Admin.</p>
              </div>
            </div>
          </div>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
            {["Admin", "Gestor", "Usuario Basico"].map((item) => <option key={item} value={item}>{displayRole(item)}</option>)}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => exportLeads("csv")} className="inline-flex items-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f755a]">
            <Download size={16} />
            Exportar CSV
          </button>
          <button onClick={() => exportLeads("xlsx")} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
            <FileDown size={16} />
            Exportar XLSX
          </button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-[#0f755a]">{message}</p> : null}

        <div className="mt-4 space-y-2">
          {items.slice(0, 6).map((lead) => (
            <div key={lead.id} className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-[#0b2434]">{lead.nome}</p>
                <p className="text-xs text-slate-500">{lead.email || "Sem e-mail"} · {lead.cpfCnpj ? "CPF/CNPJ restrito" : "Sem documento"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.deletadoEm ? <Badge tone="red">Excluído</Badge> : null}
                <button onClick={() => runAction(lead.id, "anonymize")} className="inline-flex items-center gap-1 rounded-md border border-[#c8d6dc] bg-white px-2 py-1.5 text-xs font-semibold text-[#0b2434] hover:bg-slate-50">
                  <Eraser size={14} />
                  Anonimizar
                </button>
                <button onClick={() => runAction(lead.id, "soft-delete")} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-amber-50 p-2 text-amber-700">
            <ShieldAlert size={18} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Log de auditoria</h3>
            <p className="mt-1 text-sm text-slate-600">Registro de ações sensíveis executadas no CRM.</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {logs.length ? (
            logs.map((log) => (
              <div key={log.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#0b2434]">{log.action}</strong>
                  <Badge tone="blue">{log.actorRole}</Badge>
                </div>
                <p className="mt-1 leading-5 text-slate-600">{log.description}</p>
              </div>
            ))
          ) : (
            <EmptyState title="Sem ações sensíveis" description="Anonimizações, exclusões e outras ações LGPD aparecerão aqui." />
          )}
        </div>
      </Card>
    </div>
  );
}

function displayRole(role: string) {
  return role === "Usuario Basico" ? "Usuário Básico" : role;
}

const inputClass = "rounded-md border border-[#c8d6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#138a6a] focus:ring-2 focus:ring-emerald-100";
