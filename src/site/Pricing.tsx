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
  return (
    <Section id="pricing">
      <SectionHeading section="pricing" index={index} />
      <ul className={`grid gap-5 items-stretch ${packages.length >= 3 ? "lg:grid-cols-3" : packages.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "max-w-md mx-auto"}`}>
        {packages.map((p, i) => {
          const features = isAr && p.features_ar.length ? p.features_ar : p.features_en;
          const card = (
            <div className={`relative h-full rounded-[1.75rem] p-8 flex flex-col ${p.highlighted ? "bg-surface" : "glass"}`}>
              {p.highlighted && (
                <span className="absolute -top-3.5 start-8 rounded-pill bg-grad px-3.5 py-1 text-xs font-semibold text-white shadow-[0_10px_30px_-10px_var(--accent)]">
                  {pick("Most popular", "الأكثر طلباً")}
                </span>
              )}
              <h3 className="font-display text-xl tracking-tight">{pick(p.name_en, p.name_ar)}</h3>
              {pick(p.desc_en, p.desc_ar) && <p className="mt-2 text-sm text-muted leading-relaxed">{pick(p.desc_en, p.desc_ar)}</p>}
              <p className="mt-8 flex items-baseline gap-2">
                <span className={`font-display text-5xl tracking-tight ${p.highlighted ? "text-grad" : ""}`}>{p.price}</span>
                {pick(p.period_en, p.period_ar) && <span className="text-sm text-faint">{pick(p.period_en, p.period_ar)}</span>}
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-grad text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <a href={bookable ? "#booking" : "#contact"} className={`mt-10 w-full ${p.highlighted ? btn.primary : btn.ghost}`}>
                {pick(p.cta_en, p.cta_ar) || pick("Get started", "ابدأ دلوقتي")}
              </a>
            </div>
          );
          return (
            <Reveal as="li" key={p.id} delay={i * 0.08} className={p.highlighted ? "lg:-my-4" : ""}>
              <Tilt enabled={settings.tilt_cards} max={4} className="h-full rounded-[1.75rem]">
                {p.highlighted ? <div className="h-full rounded-[1.75rem] bg-grad p-px shadow-[0_40px_100px_-40px_var(--accent)]">{card}</div> : card}
              </Tilt>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
