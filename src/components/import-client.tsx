"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, FileSpreadsheet, FileUp, RefreshCw, SearchCheck, ShieldCheck, UploadCloud, X } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";

const columns = ["Nome", "CPF/CNPJ", "Email", "Celular", "Cidade/Estado", "Valor pago", "Valor vencido", "Valor a vencer"];
type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";
const modes = [
  {
    id: "new",
    title: "Criar apenas novos",
    description: "Mais seguro para primeira validação. Duplicados ficam sinalizados antes de qualquer ação.",
  },
  {
    id: "update",
    title: "Atualizar existentes",
    description: "Indicado quando a base antiga traz telefone, valores ou e-mail mais completos.",
  },
  {
    id: "raw",
    title: "Entrada bruta",
    description: "Guarda tudo para triagem posterior, sem misturar registros suspeitos ao CRM principal.",
  },
] as const;

type ImportResult = {
  registros_lidos: number;
  resumo: { novos_leads: number; duplicados: number; erros: number; leads_atualizados: number };
  preview: { normalized: { nome?: string; whatsapp?: string; email?: string; score?: number; temperatura?: string }; duplicates: unknown[] }[];
};

type Mode = (typeof modes)[number]["id"];

export function ImportClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("new");

  const quality = useMemo(() => {
    if (!result) return { label: "Aguardando arquivo", tone: "neutral" as const, description: "Envie um CSV ou XLSX para ver a leitura da base." };
    if (result.resumo.erros > 0) return { label: "Revisar erros", tone: "red" as const, description: "Algumas linhas precisam de nome ou campos mínimos antes da importação." };
    if (result.resumo.duplicados > 0) return { label: "Duplicados encontrados", tone: "amber" as const, description: "Revise os possíveis duplicados antes de atualizar a base principal." };
    return { label: "Pronto para importar", tone: "green" as const, description: "A prévia não encontrou bloqueios nos primeiros registros lidos." };
  }, [result]);

  async function validateFile() {
    if (!file) {
      setMessage("Selecione um arquivo CSV ou XLSX.");
      return;
    }
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    const response = await fetch("/api/import/xlsx", { method: "POST", body: form });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok || payload.error) {
      setMessage(payload.error || "Não foi possível validar.");
      return;
    }
    setResult(payload);
  }

  function handleFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setResult(null);
    setMessage("");
  }

  function clearFile() {
    setFile(null);
    setResult(null);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[#dbe4e8] bg-[#0b2434] p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone={quality.tone}>{quality.label}</Badge>
                <h3 className="mt-4 text-xl font-semibold">Assistente de importação</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">{quality.description}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <FileSpreadsheet size={24} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                onDragOver={(event) => event.preventDefault()}
                className="flex min-h-60 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#9fb5bf] bg-slate-50 px-5 py-8 text-center transition hover:border-[#138a6a] hover:bg-emerald-50/40"
              >
                <span className="rounded-full bg-white p-3 text-[#138a6a] shadow-sm">
                  <UploadCloud size={28} />
                </span>
                <span className="mt-4 text-base font-semibold text-[#0b2434]">{file ? file.name : "Clique ou arraste a planilha aqui"}</span>
                <span className="mt-2 max-w-md text-sm leading-6 text-slate-600">Formatos aceitos: CSV e XLSX. A validação mostra uma prévia de até 20 linhas antes de seguir.</span>
              </button>
              <input ref={inputRef} onChange={(event) => handleFile(event.target.files?.[0])} type="file" accept=".csv,.xlsx" className="hidden" />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={validateFile}
                  disabled={busy || !file}
                  className="inline-flex items-center gap-2 rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f755a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <RefreshCw className="animate-spin" size={16} /> : <SearchCheck size={16} />}
                  {busy ? "Validando..." : result ? "Validar novamente" : "Validar arquivo"}
                </button>
                {file ? (
                  <button onClick={clearFile} className="inline-flex items-center gap-2 rounded-md border border-[#c8d6dc] bg-white px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50">
                    <X size={16} />
                    Remover
                  </button>
                ) : null}
              </div>
              {message ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#0b2434]">Como tratar a base</p>
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    mode === item.id ? "border-[#138a6a] bg-emerald-50 shadow-sm" : "border-[#dbe4e8] bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#0b2434]">{item.title}</span>
                    {mode === item.id ? <CheckCircle2 className="text-[#138a6a]" size={18} /> : null}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Checklist antes de importar</h3>
            <div className="mt-4 space-y-3">
              <ChecklistItem icon={FileUp} title="Arquivo recebido" done={Boolean(file)} description={file ? readableSize(file.size) : "Aguardando CSV ou XLSX."} />
              <ChecklistItem icon={Database} title="Colunas reconhecidas" done={Boolean(result)} description="Nome, contato e valores financeiros são normalizados." />
              <ChecklistItem icon={ShieldCheck} title="Duplicidade analisada" done={Boolean(result)} description="E-mail, telefone e documento entram na comparação." />
              <ChecklistItem icon={AlertTriangle} title="Erros revisados" done={Boolean(result && result.resumo.erros === 0)} description="Linhas sem dados mínimos aparecem no resumo." />
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[#0b2434]">Mapeamento esperado</h3>
            <p className="mt-1 text-sm text-slate-600">Use estes nomes na primeira linha da planilha para uma leitura mais precisa.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {columns.map((column) => (
                <div key={column} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{column}</span>
                  <Badge tone="green">ok</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#0b2434]">Resumo da validação</h3>
            <p className="mt-1 text-sm text-slate-600">Antes de gravar qualquer coisa, confira volume, duplicados e qualidade da base.</p>
          </div>
          <Badge tone={quality.tone}>{quality.label}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {([
            ["Registros lidos", result?.registros_lidos ?? 0, "blue" as const],
            ["Novos leads", result?.resumo.novos_leads ?? 0, "green" as const],
            ["Duplicados", result?.resumo.duplicados ?? 0, "amber" as const],
            ["Erros", result?.resumo.erros ?? 0, "red" as const],
            ["Atualizados", result?.resumo.leads_atualizados ?? 0, "neutral" as const],
          ] satisfies [string, number, BadgeTone][]).map(([label, value, tone]) => (
            <div key={String(label)} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <Badge tone={tone}>{String(label)}</Badge>
              <p className="mt-3 text-3xl font-semibold text-[#0b2434]">{String(value)}</p>
            </div>
          ))}
        </div>

        <Preview result={result} />
      </Card>
    </div>
  );
}

function ChecklistItem({ icon: Icon, title, description, done }: { icon: React.ElementType; title: string; description: string; done: boolean }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
      <span className={`mt-0.5 rounded-md p-2 ${done ? "bg-emerald-50 text-[#138a6a]" : "bg-white text-slate-400"}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#0b2434]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Preview({ result }: { result: ImportResult | null }) {
  if (!result?.preview?.length) {
    return (
      <div className="mt-5">
        <EmptyState title="Prévia ainda não gerada" description="Escolha uma planilha e valide o arquivo para conferir os primeiros registros normalizados." />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#0b2434]">Prévia dos primeiros registros</h4>
        <span className="text-xs text-slate-500">Mostrando até 20 linhas</span>
      </div>

      <div className="grid gap-3 md:hidden">
        {result.preview.map((item, index) => (
          <article key={index} className="rounded-lg border border-[#dbe4e8] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#0b2434]">{item.normalized.nome || "Sem nome"}</p>
                <p className="mt-1 truncate text-sm text-slate-600">{item.normalized.email || item.normalized.whatsapp || "Sem contato"}</p>
              </div>
              <Badge tone={item.duplicates.length ? "amber" : "green"}>{item.duplicates.length ? "Duplicado" : "Novo"}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Mini label="Score" value={String(item.normalized.score ?? "-")} />
              <Mini label="Temperatura" value={item.normalized.temperatura || "-"} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-[#dbe4e8] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{["Nome", "WhatsApp", "E-mail", "Score", "Temperatura", "Status"].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f4]">
            {result.preview.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="max-w-[220px] truncate px-3 py-3 font-medium text-[#0b2434]">{item.normalized.nome || "-"}</td>
                <td className="px-3 py-3">{item.normalized.whatsapp || "-"}</td>
                <td className="max-w-[220px] truncate px-3 py-3">{item.normalized.email || "-"}</td>
                <td className="px-3 py-3">{item.normalized.score ?? "-"}</td>
                <td className="px-3 py-3">{item.normalized.temperatura || "-"}</td>
                <td className="px-3 py-3"><Badge tone={item.duplicates.length ? "amber" : "green"}>{item.duplicates.length ? "Duplicado" : "Novo"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-[#0b2434]">{value}</p>
    </div>
  );
}

function readableSize(size: number) {
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(Math.round(size / 1024), 1)} KB`;
}
