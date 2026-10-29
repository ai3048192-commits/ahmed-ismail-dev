import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import type { Service } from "../lib/types";
import { Reveal, Spotlight, Tilt } from "./Effects";
import { SERVICE_ICONS, type ServiceIconName } from "./icons";
import { Section, SectionHeading } from "./ui";

export default function Services({ services, index }: { services: Service[]; index: string }) {
  const { pick } = usePrefs();
  const { settings } = useSettings();
  return (
    <Section id="services">
      <SectionHeading section="services" index={index} />
      <ul className={`grid gap-4 sm:grid-cols-2 ${services.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {services.map((s, i) => {
          const Icon = SERVICE_ICONS[s.icon as ServiceIconName] || SERVICE_ICONS.code;
          return (
            <Reveal as="li" key={s.id} delay={i * 0.07}>
              <Tilt enabled={settings.tilt_cards} max={6} className="h-full rounded-3xl">
                <Spotlight className="glass h-full rounded-3xl p-7">
                  <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-grad text-white shadow-[0_14px_34px_-12px_var(--accent)] [transform:translateZ(40px)]">
                    <Icon size={24} />
                  </span>
                  <h3 className="relative mt-10 font-display text-xl tracking-tight">{pick(s.title_en, s.title_ar)}</h3>
                  <p className="relative mt-3 text-sm text-muted leading-relaxed">{pick(s.desc_en, s.desc_ar)}</p>
                  <span aria-hidden className="absolute top-6 end-6 font-mono text-xs text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Spotlight>
              </Tilt>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
