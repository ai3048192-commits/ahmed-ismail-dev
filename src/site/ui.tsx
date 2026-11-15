import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { SectionId } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import { Reveal } from "./Effects";

/** last word of a title in the accent color */
export function GradientTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <span className="text-accent-ink">{text}</span>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-accent-ink">{last}</span>
    </>
  );
}

/** editorial section header: "01 — Eyebrow" over a hairline, big title, intro beside it on wide screens.
 *  texts come from the dashboard (Design → section texts) */
export function SectionHeading({ section, index, fallbackIntro = "" }: { section: SectionId; index: string; fallbackIntro?: string; align?: "center" | "start" }) {
  const { settings: s } = useSettings();
  const { pick } = usePrefs();
  const eyebrow = pick(s[`${section}_eyebrow_en`], s[`${section}_eyebrow_ar`]);
  const title = pick(s[`${section}_title_en`], s[`${section}_title_ar`]);
  const intro = pick(s[`${section}_intro_en`], s[`${section}_intro_ar`]) || fallbackIntro;
  return (
    <Reveal className="mb-12 md:mb-16">
      <p className="flex items-center gap-3 border-b border-line pb-4 text-xs font-medium uppercase ltr:tracking-[0.14em] text-muted">
        <span className="font-mono text-accent-ink">{index}</span>
        <span aria-hidden className="h-px w-6 bg-line" />
        {eyebrow}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <h2 className="text-[2.2rem] leading-[1.04] sm:text-5xl lg:text-[3.6rem] tracking-[-0.035em] text-balance">
          <GradientTitle text={title} />
        </h2>
        {intro && <p className="max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg lg:justify-self-end lg:pb-2">{intro}</p>}
      </div>
    </Reveal>
  );
}

export function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative px-5 sm:px-8 py-20 md:py-28 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

/** accessible dialog: Escape closes, body scroll locks, focus returns to the opener */
export function Modal({
  open,
  onClose,
  label,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 animate-[fade-in_.2s_ease-out]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"} max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-surface border border-line shadow-2xl animate-[sheet-in_.3s_cubic-bezier(.22,1,.36,1)]`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sticky top-3 z-10 ms-auto me-3 mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-fg hover:bg-line"
        >
          <X size={18} />
        </button>
        <div className="-mt-10">{children}</div>
      </div>
    </div>
  );
}
