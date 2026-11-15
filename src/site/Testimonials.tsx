import { usePrefs } from "../lib/prefs";
import type { Testimonial } from "../lib/types";
import { Reveal } from "./Effects";
import { Section, SectionHeading } from "./ui";

function Card({ t }: { t: Testimonial }) {
  const { pick } = usePrefs();
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-line bg-surface p-7 sm:p-8">
      <span aria-hidden className="font-display text-5xl font-bold leading-none text-accent-ink">
        “
      </span>
      <blockquote className="mt-3 flex-1 text-base leading-relaxed sm:text-lg">{pick(t.quote_en, t.quote_ar)}</blockquote>
      <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-5">
        {t.avatar ? (
          <img src={t.avatar} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 font-semibold">{t.name[0]}</span>
        )}
        <span>
          <span className="block text-sm font-semibold">{t.name}</span>
          <span className="block text-xs text-faint">{pick(t.role_en, t.role_ar)}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials({ items, index }: { items: Testimonial[]; index: string }) {
  const cols = items.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : items.length === 2 ? "md:grid-cols-2" : "max-w-2xl";
  return (
    <Section id="testimonials">
      <SectionHeading section="testimonials" index={index} />
      <ul className={`grid gap-5 ${cols}`}>
        {items.map((t, i) => (
          <Reveal as="li" key={t.id} delay={(i % 3) * 0.06}>
            <Card t={t} />
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
