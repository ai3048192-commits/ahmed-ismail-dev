import { Check } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Package } from "../lib/types";
import { Reveal } from "./Effects";
import { btn } from "./styles";
import { Section, SectionHeading } from "./ui";

export default function Pricing({ packages, index, bookable }: { packages: Package[]; index: string; bookable: boolean }) {
  const { pick, isAr } = usePrefs();

  const layout = packages.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : packages.length === 2 ? "md:grid-cols-2 max-w-4xl" : "max-w-md";

  return (
    <Section id="pricing">
      <SectionHeading section="pricing" index={index} />

      <ul className={`grid gap-5 items-stretch ${layout}`}>
        {packages.map((p, i) => {
          const features = isAr && p.features_ar.length ? p.features_ar : p.features_en;
          const desc = pick(p.desc_en, p.desc_ar);
          const period = pick(p.period_en, p.period_ar);
          const hl = !!p.highlighted;
          // the highlighted package is printed in reverse: ink background, paper text
          const sub = hl ? "text-bg/65" : "text-muted";

          return (
            <Reveal as="li" key={p.id} delay={i * 0.06}>
              <article className={`relative flex h-full flex-col rounded-3xl border p-7 sm:p-8 ${hl ? "border-fg bg-fg text-bg" : "border-line bg-surface"}`}>
                <header className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-bold tracking-tight">{pick(p.name_en, p.name_ar)}</h3>
                  {hl && <span className="shrink-0 rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">{pick("Most popular", "الأكثر طلباً")}</span>}
                </header>

                <p className={`mt-2 min-h-[2.75rem] text-sm leading-relaxed ${sub}`}>{desc}</p>

                <p className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold tracking-tight tabular-nums">{p.price}</span>
                  {period && <span className={`text-sm ${sub}`}>{period}</span>}
                </p>

                <div className={`mt-8 flex-1 border-t pt-7 ${hl ? "border-bg/15" : "border-line"}`}>
                  <ul className="space-y-3.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check size={16} strokeWidth={2.5} className={`mt-0.5 shrink-0 ${hl ? "text-accent" : "text-accent-ink"}`} aria-hidden />
                        <span className={sub}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a href={bookable ? "#booking" : "#contact"} className={`mt-8 w-full ${hl ? btn.accent : btn.ghost}`}>
                  {pick(p.cta_en, p.cta_ar) || pick("Get started", "ابدأ دلوقتي")}
                </a>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
