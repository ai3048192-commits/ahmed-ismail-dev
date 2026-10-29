import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Faq as FaqItem } from "../lib/types";
import { Reveal } from "./Effects";
import { Section, SectionHeading } from "./ui";

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`glass rounded-3xl transition-shadow ${open ? "shadow-[0_24px_60px_-34px_var(--accent)]" : ""}`}>
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-6 px-6 py-5 text-start">
          <span className="font-display text-lg tracking-tight">{q}</span>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-pill transition-all duration-300 ${open ? "bg-grad text-white rotate-45" : "border border-line text-muted"}`}>
            <Plus size={16} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="px-6 pb-6 text-muted leading-relaxed whitespace-pre-line">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq({ faqs, index }: { faqs: FaqItem[]; index: string }) {
  const { pick } = usePrefs();
  const [open, setOpen] = useState<number | null>(faqs[0]?.id ?? null);
  return (
    <Section id="faq">
      <SectionHeading section="faq" index={index} />
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.id} delay={i * 0.04}>
            <Item q={pick(f.q_en, f.q_ar)} a={pick(f.a_en, f.a_ar)} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
