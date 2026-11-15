import { useState } from "react";
import { Award, Briefcase, ExternalLink, Eye, GraduationCap } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Experience as Item, ExperienceKind } from "../lib/types";
import { Reveal } from "./Effects";
import { Modal, Section, SectionHeading } from "./ui";
import { btn } from "./styles";

const KINDS: Record<ExperienceKind, { en: string; ar: string; Icon: typeof Briefcase }> = {
  work: { en: "Work", ar: "شغل", Icon: Briefcase },
  education: { en: "Education", ar: "دراسة", Icon: GraduationCap },
  certificate: { en: "Certificate", ar: "شهادة", Icon: Award },
};
const ORDER: ExperienceKind[] = ["work", "education", "certificate"];

/** a plain ledger: period on one side, the role on the other, hairlines between rows */
export default function Experience({ items, index }: { items: Item[]; index: string }) {
  const { pick } = usePrefs();
  const [openId, setOpenId] = useState<number | null>(null);
  const open = items.find((i) => i.id === openId);
  const list = [...items].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.sort_order - b.sort_order);

  return (
    <Section id="experience">
      <SectionHeading section="experience" index={index} />

      <ol className="border-t border-line">
        {list.map((it) => {
          const { Icon, en, ar } = KINDS[it.kind] || KINDS.work;
          const desc = pick(it.desc_en, it.desc_ar);
          return (
            <Reveal as="li" key={it.id} className="grid gap-4 border-b border-line py-8 md:grid-cols-[220px_minmax(0,1fr)_auto] md:gap-10">
              <div className="flex items-center gap-3 md:block">
                <p className="font-mono text-xs text-faint">{it.period}</p>
                <p className="inline-flex items-center gap-1.5 text-xs text-muted md:mt-3">
                  <Icon size={13} aria-hidden /> {pick(en, ar)}
                </p>
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{pick(it.title_en, it.title_ar)}</h3>
                <p className="mt-1 text-sm font-medium text-accent-ink">{pick(it.org_en, it.org_ar)}</p>
                {desc && <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted">{desc}</p>}
              </div>
              {it.image && (
                <div className="md:self-center">
                  <button type="button" onClick={() => setOpenId(it.id)} className={`${btn.ghost} !py-2 !px-4`}>
                    <Eye size={15} aria-hidden /> {pick("Certificate", "الشهادة")}
                  </button>
                </div>
              )}
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
                <p className="font-display text-xl font-bold">{pick(open.title_en, open.title_ar)}</p>
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
