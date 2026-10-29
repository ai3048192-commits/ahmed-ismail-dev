import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import type { Service } from "../lib/types";
import { Reveal, Spotlight, Tilt } from "./Effects";
import { SERVICE_ICONS, type ServiceIconName } from "./icons";
import { Section, SectionHeading } from "./ui";

/** grid that always fills its row: 1 → centred card, 2 → two wide, 3 → three, 4+ → four across */
function gridFor(count: number) {
  if (count >= 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (count === 2) return "sm:grid-cols-2 max-w-4xl mx-auto";
  return "max-w-md mx-auto";
}

function ServiceCard({ service: s }: { service: Service }) {
  const { pick } = usePrefs();
  const Icon = SERVICE_ICONS[s.icon as ServiceIconName] || SERVICE_ICONS.code;

  return (
    // the group lets the icon and the underline react when the card is hovered
    <Spotlight className="group relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-7 transition-colors duration-300 hover:border-accent/50">
      {/* icon: outlined at rest, fills with the accent and tilts on hover */}
      <span className="relative inline-block [transform:translateZ(40px)]">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface-2 text-accent-ink transition-all duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg group-hover:shadow-[0_14px_34px_-12px_var(--accent)] motion-reduce:transition-colors motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100">
          <Icon size={24} aria-hidden />
        </span>
      </span>

      <h3 className="relative mt-9 font-display text-xl tracking-tight">{pick(s.title_en, s.title_ar)}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted">{pick(s.desc_en, s.desc_ar)}</p>

      {/* underline that draws itself from the start edge on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100 rtl:origin-right motion-reduce:transition-none"
      />
    </Spotlight>
  );
}

export default function Services({ services, index }: { services: Service[]; index: string }) {
  const { settings } = useSettings();

  return (
    <Section id="services">
      <SectionHeading section="services" index={index} />
      <ul className={`grid items-stretch gap-4 ${gridFor(services.length)}`}>
        {services.map((s, i) => (
          <Reveal as="li" key={s.id} delay={i * 0.07}>
            <Tilt enabled={settings.tilt_cards} max={4} className="h-full rounded-3xl">
              <ServiceCard service={s} />
            </Tilt>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}