import { Quote } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Testimonial } from "../lib/types";
import { Section, SectionHeading } from "./ui";
import { useMotionOK } from "./useMotionOK";

function Card({ t }: { t: Testimonial }) {
  const { pick, isAr } = usePrefs();
  return (
    <figure dir={isAr ? "rtl" : "ltr"} className="glass w-[min(82vw,400px)] shrink-0 rounded-3xl p-7 flex flex-col">
      <Quote size={22} className="text-accent-ink" aria-hidden />
      <blockquote className="mt-5 leading-relaxed flex-1">{pick(t.quote_en, t.quote_ar)}</blockquote>
      <figcaption className="mt-7 flex items-center gap-3">
        {t.avatar ? (
          <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-grad text-white font-semibold">{t.name[0]}</span>
        )}
        <span>
          <span className="block text-sm font-semibold">{t.name}</span>
          <span className="block text-xs text-faint">{pick(t.role_en, t.role_ar)}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** two rows drifting in opposite directions; a plain wrap when motion is off */
export default function Testimonials({ items, index }: { items: Testimonial[]; index: string }) {
  const motionOK = useMotionOK();
  const rows = items.length > 3 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items];

  return (
    <Section id="testimonials">
      <SectionHeading section="testimonials" index={index} />
      {!motionOK || items.length < 3 ? (
        <div className="flex flex-wrap justify-center gap-4">
          {items.map((t) => (
            <Card key={t.id} t={t} />
          ))}
        </div>
      ) : (
        <div dir="ltr" className="space-y-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          {rows.map((row, r) => (
            <div key={r} className="overflow-hidden">
              <div
                style={{ "--marquee-gap": "8px", animation: `marquee ${row.length * 9}s linear infinite ${r % 2 ? "reverse" : ""}` } as React.CSSProperties}
                className="flex w-max gap-4 hover:[animation-play-state:paused]"
              >
                {[...row, ...row].map((t, i) => (
                  <div key={`${t.id}-${i}`} aria-hidden={i >= row.length} className="flex">
                    <Card t={t} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
