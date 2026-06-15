import { clsx } from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("rounded-lg border border-[#dbe4e8] bg-white p-4 shadow-sm", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#b8c9d1] bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-[#0b2434]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
