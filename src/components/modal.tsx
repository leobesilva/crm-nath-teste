"use client";

import { X } from "lucide-react";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const width = size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b2434]/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`max-h-[90vh] w-full ${width} overflow-hidden rounded-lg border border-[#dbe4e8] bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2f4] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0b2434]">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-md border border-[#dbe4e8] p-2 text-slate-600 hover:bg-slate-50" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="crm-scrollbar max-h-[calc(90vh-92px)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
