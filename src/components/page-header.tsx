import Link from "next/link";

type Action = {
  label: string;
  href: string;
};

export function PageHeader({ title, description, actions = [] }: { title: string; description?: string; actions?: Action[] }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[#dbe4e8] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-[#0b2434] md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                index === 0
                  ? "rounded-md bg-[#138a6a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f755a]"
                  : "rounded-md border border-[#c8d6dc] bg-white px-4 py-2 text-sm font-semibold text-[#0b2434] hover:bg-slate-50"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
