import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { Award, Briefcase, ExternalLink, Eye, GraduationCap } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Experience as Item, ExperienceKind } from "../lib/types";
import { Reveal, Spotlight } from "./Effects";
import { Modal, Section, SectionHeading } from "./ui";
import { btn } from "./styles";

const KINDS: Record<ExperienceKind, { en: string; ar: string; Icon: typeof Briefcase }> = {
  work: { en: "Work", ar: "شغل", Icon: Briefcase },
  education: { en: "Education", ar: "دراسة", Icon: GraduationCap },
  certificate: { en: "Certificate", ar: "شهادة", Icon: Award },
};
const ORDER: ExperienceKind[] = ["work", "education", "certificate"];

/** one timeline down the middle, cards alternating sides; the line fills as you scroll */
export default function Experience({ items, index }: { items: Item[]; index: string }) {
  const { pick } = usePrefs();
  const [openId, setOpenId] = useState<number | null>(null);
  const line = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: line, offset: ["start 70%", "end 60%"] });
  const open = items.find((i) => i.id === openId);
  const list = [...items].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.sort_order - b.sort_order);

  return (
    <Section id="experience">
      <SectionHeading section="experience" index={index} />

      <ol ref={line} className="relative mx-auto max-w-5xl">
        <span aria-hidden className="absolute top-0 bottom-0 start-5 md:start-1/2 w-px bg-line" />
        <motion.span aria-hidden className="absolute top-0 bottom-0 start-5 md:start-1/2 w-px bg-grad origin-top" style={{ scaleY: scrollYProgress }} />

        {list.map((it, i) => {
          const { Icon, en, ar } = KINDS[it.kind] || KINDS.work;
          const side = i % 2 === 0;
          return (
            <Reveal as="li" key={it.id} className={`relative ps-14 md:ps-0 pb-10 md:w-1/2 ${side ? "md:pe-12" : "md:ms-auto md:ps-12"}`}>
              <span
                className={`absolute top-6 start-0 md:start-auto grid h-10 w-10 place-items-center rounded-pill bg-grad text-white shadow-[0_0_0_6px_var(--bg),0_10px_30px_-10px_var(--accent)] ${
                  side ? "md:-end-5" : "md:-start-5"
                }`}
              >
                <Icon size={16} />
              </span>
              <Spotlight className="glass rounded-3xl p-6">
                <div className="relative flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-pill bg-surface-2/80 px-2.5 py-1 text-[11px] text-muted">{pick(en, ar)}</span>
                  <span className="font-mono text-xs text-faint">{it.period}</span>
                </div>
                <h3 className="relative mt-4 font-display text-xl tracking-tight">{pick(it.title_en, it.title_ar)}</h3>
                <p className="relative mt-1 text-sm text-accent-ink">{pick(it.org_en, it.org_ar)}</p>
                {pick(it.desc_en, it.desc_ar) && <p className="relative mt-3 text-sm text-muted leading-relaxed">{pick(it.desc_en, it.desc_ar)}</p>}
                {it.image && (
                  <button type="button" onClick={() => setOpenId(it.id)} className={`${btn.ghost} relative mt-5 !py-2 !px-4`}>
                    <Eye size={15} /> {pick("View certificate", "اعرض الشهادة")}
                  </button>
                )}
              </Spotlight>
            </Reveal>
          );
        })}
      </ol>

      <Modal open={!!open} onClose={() => setOpenId(null)} label={open ? pick(open.title_en, open.title_ar) : ""} wide>
        {open && (
          <div>
            <img src={open.image} alt={pick(open.title_en, open.title_ar)} className="w-full rounded-t-3xl bg-surface-2" />
            <div className="p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl">{pick(open.title_en, open.title_ar)}</p>
                <p className="text-sm text-muted">
                  {pick(open.org_en, open.org_ar)} · {open.period}
                </p>
              </div>
              {open.verify_url && (
                <a href={open.verify_url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                  {pick("Verify", "تحقق من الشهادة")} <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
