import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { SectionId } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import { Reveal } from "./Effects";

/** last word of a title in the brand gradient */
export function GradientTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <span className="text-grad">{text}</span>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-grad">{last}</span>
    </>
  );
}

/** texts come from the dashboard (Design → section texts) */
export function SectionHeading({ section, index, fallbackIntro = "", align = "center" }: { section: SectionId; index: string; fallbackIntro?: string; align?: "center" | "start" }) {
  const { settings: s } = useSettings();
  const { pick } = usePrefs();
  const eyebrow = pick(s[`${section}_eyebrow_en`], s[`${section}_eyebrow_ar`]);
  const title = pick(s[`${section}_title_en`], s[`${section}_title_ar`]);
  const intro = pick(s[`${section}_intro_en`], s[`${section}_intro_ar`]) || fallbackIntro;
  const center = align === "center";
  return (
    <Reveal className={`mb-14 md:mb-20 ${center ? "text-center mx-auto max-w-3xl" : "max-w-3xl"}`}>
      <span className="glass inline-flex items-center gap-2.5 rounded-pill px-4 py-1.5 text-xs font-medium text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-grad" aria-hidden />
        <span className="font-mono text-faint">{index}</span>
        {eyebrow}
      </span>
      <h2 className="mt-6 text-[2.3rem] leading-[1.05] sm:text-5xl lg:text-6xl tracking-tight text-balance">
        <GradientTitle text={title} />
      </h2>
      {intro && <p className={`mt-5 text-muted leading-relaxed text-base sm:text-lg ${center ? "mx-auto max-w-[56ch]" : "max-w-[56ch]"}`}>{intro}</p>}
    </Reveal>
  );
}

export function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative px-5 sm:px-8 py-24 md:py-32 ${className}`}>
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
  const reduce = useReducedMotion();
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={`relative w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"} max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-surface border border-line shadow-2xl`}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
