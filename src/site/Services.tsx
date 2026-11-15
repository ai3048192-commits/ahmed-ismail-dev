import { usePrefs } from "../lib/prefs";
import type { Service } from "../lib/types";
import { Reveal } from "./Effects";
import { SERVICE_ICONS, type ServiceIconName } from "./icons";
import { Section, SectionHeading } from "./ui";

/** column count by number of services, picked so rows come out as full as possible */
function gridFor(count: number) {
  if (count === 4 || count >= 7) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count >= 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (count === 2) return "sm:grid-cols-2";
  return "";
}

export default function Services({ services, index }: { services: Service[]; index: string }) {
  const { pick } = usePrefs();

  return (
    <Section id="services">
      <SectionHeading section="services" index={index} />
      {/* one bordered table of cells: each cell's 1px outline fills the 1px gap, so a short last row leaves no grey hole */}
      <Reveal>
        <ul className={`grid gap-px overflow-hidden rounded-3xl border border-line bg-surface ${gridFor(services.length)}`}>
          {services.map((s, i) => {
            const Icon = SERVICE_ICONS[s.icon as ServiceIconName] || SERVICE_ICONS.code;
            return (
              <li key={s.id} className="group relative flex flex-col bg-surface p-7 shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-surface-2 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-fg transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                    <Icon size={22} aria-hidden />
                  </span>
                  <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-10 font-display text-xl font-bold tracking-tight">{pick(s.title_en, s.title_ar)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{pick(s.desc_en, s.desc_ar)}</p>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Section>
  );
}
