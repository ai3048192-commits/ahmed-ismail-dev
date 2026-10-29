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

/** small progress ring in the skill's own color */
function Ring({ level, color }: { level: number; color: string }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90 shrink-0" role="img" aria-label={`${level}%`}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
      <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - level / 100)} />
    </svg>
  );
}

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
      <div className="glass rounded-[2rem] divide-y divide-line">
        {groups.map((g, gi) => (
          <Reveal key={g.name} delay={gi * 0.05} className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-3xl tracking-tight text-grad">{isAr ? CATEGORY_AR[g.name] || g.name : g.name}</h3>
              <span className="font-mono text-xs text-faint">{String(g.items.length).padStart(2, "0")}</span>
            </div>
            <ul className="flex flex-wrap gap-2.5">
              {g.items.map((s) => (
                <li
                  key={s.id}
                  title={pick(s.desc_en, s.desc_ar) || undefined}
                  className="group flex items-center gap-2.5 rounded-pill border border-line bg-bg/40 ps-1.5 pe-4 py-1.5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ boxShadow: `0 0 0 0 ${s.color}` }}
                  onPointerEnter={(e) => (e.currentTarget.style.boxShadow = `0 10px 30px -12px ${s.color}`)}
                  onPointerLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0 ${s.color}`)}
                >
                  <Ring level={s.level} color={s.color} />
                  <span className="text-sm font-medium">{pick(s.name_en.trim(), s.name_ar)}</span>
                  <span className="font-mono text-[11px] text-faint">{s.level}%</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
