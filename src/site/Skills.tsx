import { useMemo } from "react";
import { usePrefs } from "../lib/prefs";
import { SKILL_CATEGORIES, type Skill } from "../lib/types";
import { Reveal } from "./Effects";
import { Section, SectionHeading } from "./ui";

const CATEGORY_AR: Record<string, string> = {
  Frontend: "الواجهات",
  Backend: "الباك إند",
  Design: "التصميم",
  Tools: "الأدوات",
  Performance: "الأداء",
};

export default function Skills({ skills, index }: { skills: Skill[]; index: string }) {
  const { pick, isAr } = usePrefs();

  const groups = useMemo(() => {
    const present = [...new Set(skills.map((s) => s.category))];
    const known = SKILL_CATEGORIES.filter((c) => present.includes(c));
    const custom = present.filter((c) => !(SKILL_CATEGORIES as readonly string[]).includes(c));
    return [...known, ...custom].map((c) => ({ name: c, items: skills.filter((s) => s.category === c) }));
  }, [skills]);

  return (
    <Section id="skills">
      <SectionHeading section="skills" index={index} />
      <div className="border-t border-line">
        {groups.map((g, gi) => (
          <Reveal key={g.name} delay={gi * 0.04} className="grid gap-5 border-b border-line py-8 lg:grid-cols-[260px_1fr] lg:items-start lg:gap-10">
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-2xl font-bold tracking-tight">{isAr ? CATEGORY_AR[g.name] || g.name : g.name}</h3>
              <span className="font-mono text-xs text-faint">{String(g.items.length).padStart(2, "0")}</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <li
                  key={s.id}
                  title={pick(s.desc_en, s.desc_ar) || undefined}
                  className="relative flex items-center gap-2.5 overflow-hidden rounded-pill border border-line bg-surface px-4 py-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="text-sm font-medium">{pick(s.name_en.trim(), s.name_ar)}</span>
                  <span className="font-mono text-[11px] text-faint">{s.level}%</span>
                  {/* level as a hairline along the bottom edge */}
                  <span aria-hidden className="absolute bottom-0 start-0 h-[2px] opacity-70" style={{ width: `${s.level}%`, background: s.color }} />
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
