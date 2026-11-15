import { Plus } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Faq as FaqItem } from "../lib/types";
import { Section, SectionHeading } from "./ui";

/** native <details>: opens and closes with zero JavaScript */
export default function Faq({ faqs, index }: { faqs: FaqItem[]; index: string }) {
  const { pick } = usePrefs();
  return (
    <Section id="faq">
      <SectionHeading section="faq" index={index} />
      <div className="border-t border-line">
        {faqs.map((f, i) => (
          <details key={f.id} open={i === 0} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-6 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <h3 className="flex items-baseline gap-4 font-display text-lg font-bold tracking-tight sm:text-xl">
                <span className="font-mono text-xs font-normal text-faint">{String(i + 1).padStart(2, "0")}</span>
                {pick(f.q_en, f.q_ar)}
              </h3>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line text-muted transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:border-fg group-open:bg-fg group-open:text-bg">
                <Plus size={16} aria-hidden />
              </span>
            </summary>
            <p className="max-w-[70ch] whitespace-pre-line pb-7 ps-9 leading-relaxed text-muted">{pick(f.a_en, f.a_ar)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
