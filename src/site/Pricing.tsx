import { Check } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import type { Package } from "../lib/types";
import { Reveal, Tilt } from "./Effects";
import { btn } from "./styles";
import { Section, SectionHeading } from "./ui";

export default function Pricing({ packages, index, bookable }: { packages: Package[]; index: string; bookable: boolean }) {
  const { pick, isAr } = usePrefs();
  const { settings } = useSettings();

  const layout =
    packages.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : packages.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "max-w-md mx-auto";

  return (
    <Section id="pricing">
      <SectionHeading section="pricing" index={index} />

      <ul className={`grid gap-5 items-stretch ${layout}`}>
        {packages.map((p, i) => {
          const features = isAr && p.features_ar.length ? p.features_ar : p.features_en;
          const desc = pick(p.desc_en, p.desc_ar);
          const period = pick(p.period_en, p.period_ar);
          const hl = !!p.highlighted;

          return (
            <Reveal as="li" key={p.id} delay={i * 0.08}>
              <Tilt enabled={settings.tilt_cards} max={3} className="h-full rounded-3xl">
                <article
                  className={`relative flex h-full flex-col rounded-3xl border bg-surface p-7 sm:p-8 transition-colors ${
                    hl
                      ? "border-accent shadow-[0_30px_80px_-45px_var(--accent)]"
                      : "border-line hover:border-fg/25"
                  }`}
                >
                  {/* header: name + badge on one row so every card lines up */}
                  <header className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl tracking-tight">{pick(p.name_en, p.name_ar)}</h3>
                    {hl && (
                      <span className="shrink-0 rounded-pill border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-ink">
                        {pick("Most popular", "الأكثر طلباً")}
                      </span>
                    )}
                  </header>

                  <p className="mt-2 min-h-[2.75rem] text-sm leading-relaxed text-muted">{desc}</p>

                  {/* price */}
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-5xl tracking-tight tabular-nums">{p.price}</span>
                    {period && <span className="text-sm text-faint">{period}</span>}
                  </p>

                  {/* features */}
                  <div className="mt-7 flex-1 border-t border-line pt-7">
                    <ul className="space-y-3.5">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
                          <span className="text-muted">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* action */}
                  <a href={bookable ? "#booking" : "#contact"} className={`mt-8 w-full ${hl ? btn.primary : btn.ghost}`}>
                    {pick(p.cta_en, p.cta_ar) || pick("Get started", "ابدأ دلوقتي")}
                  </a>
                </article>
              </Tilt>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}