import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted mt-1.5 max-w-[60ch]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line py-16 grid place-items-center text-center text-sm text-muted gap-3">
      <Inbox size={22} className="text-faint" />
      {text}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
