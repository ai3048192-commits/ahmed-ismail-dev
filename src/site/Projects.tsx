import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Project } from "../lib/types";
import { Reveal } from "./Effects";
import { Section, SectionHeading } from "./ui";

const CATEGORY_AR: Record<string, string> = {
  Applications: "التطبيقات",
  Dashboards: "لوحات التحكم",
  "E-Commerce": "المتاجر",
  Platforms: "المنصات",
  Systems: "الأنظمة",
};

export function Cover({ p, className = "", eager = false }: { p: Project; className?: string; eager?: boolean }) {
  return p.image ? (
    <img src={p.image} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className={`w-full h-full object-cover object-top ${className}`} />
  ) : (
    <div className={`w-full h-full grid place-items-center bg-surface-2 font-mono text-sm text-faint ${className}`} dir="ltr">
      {"<"}
      {p.name_en.replace(/\s+/g, "")}
      {" />"}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

function Card({ p, n, label, big = false }: { p: Project; n: number; label: (c: string) => string; big?: boolean }) {
  const { pick, isAr } = usePrefs();
  const tags = (isAr && p.tags_ar.length ? p.tags_ar : p.tags_en).slice(0, big ? 5 : 3);

  return (
    <article className={`group relative grid h-full gap-6 ${big ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-12" : ""}`}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-surface-2">
        <Cover p={p} className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        {p.featured && (
          <span className="absolute top-4 start-4 rounded-pill bg-bg/90 px-3 py-1 text-[11px] font-semibold text-fg">{pick("Featured", "مميز")}</span>
        )}
      </div>

      <div className="flex flex-col">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
          <span className="font-mono text-accent-ink">{String(n).padStart(2, "0")}</span>
          <span>{label(p.category)}</span>
          {p.year && <span className="tabular-nums">· {p.year}</span>}
        </p>

        <h3 className={`mt-3 font-display font-bold tracking-tight leading-tight ${big ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
          {/* the whole card is clickable through this link's overlay */}
          <Link to={`/work/${p.slug}`} className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent">
            {pick(p.name_en, p.name_ar)}
          </Link>
        </h3>
        <p className={`mt-3 text-sm leading-relaxed text-muted ${big ? "sm:text-base" : "line-clamp-2"}`}>{pick(p.desc_en, p.desc_ar)}</p>

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <li key={t} className="max-w-[10rem] truncate rounded-pill border border-line px-2.5 py-1 text-[11px] text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            {pick("Case study", "تفاصيل المشروع")}
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          </span>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("project_link", p.name_en)}
              className="relative z-10 ms-auto inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs text-muted hover:border-fg/30 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ExternalLink size={13} aria-hidden /> {pick("Live site", "الموقع")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function Projects({ projects, index }: { projects: Project[]; index: string }) {
  const { pick, isAr } = usePrefs();
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const { settings } = useSettings();

  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category).filter(Boolean))], [projects]);
  // featured projects first, then the dashboard order
  const sorted = useMemo(() => [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)), [projects]);
  const list = filter === "All" ? sorted : sorted.filter((p) => p.category === filter);
  const label = (c: string) => (c === "All" ? pick("All", "الكل") : isAr ? CATEGORY_AR[c] || c : c);
  const countOf = (c: string) => (c === "All" ? projects.length : projects.filter((p) => p.category === c).length);

  const LIMIT = Math.max(1, Number(settings.projects_per_page) || 7);
  const visible = showAll ? list : list.slice(0, LIMIT);
  const [first, ...rest] = visible;

  return (
    <Section id="work">
      <SectionHeading section="work" index={index} />

      {categories.length > 2 && (
        <div className="-mx-5 mb-12 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label={pick("Filter projects", "فلترة المشاريع")}>
          <div className="flex w-max gap-2">
            {categories.map((c) => {
              const on = filter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setFilter(c);
                    setShowAll(false);
                  }}
                  aria-pressed={on}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    on ? "border-fg bg-fg font-medium text-bg" : "border-line text-muted hover:text-fg"
                  }`}
                >
                  {label(c)}
                  <span className={`font-mono text-[11px] tabular-nums ${on ? "opacity-60" : "text-faint"}`}>{countOf(c)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!first ? (
        <p className="py-16 text-center text-muted">{pick("No projects in this category yet.", "مفيش مشاريع في القسم ده لسه.")}</p>
      ) : (
        <>
          <Reveal className="border-b border-line pb-14">
            <Card p={first} n={1} label={label} big />
          </Reveal>
          {rest.length > 0 && (
            <ul className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
              {rest.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 2) * 0.06}>
                  <Card p={p} n={i + 2} label={label} />
                </Reveal>
              ))}
            </ul>
          )}
          {list.length > LIMIT && !showAll && (
            <div className="mt-14 text-center">
              <button type="button" onClick={() => setShowAll(true)} className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-6 py-3 text-sm font-medium hover:border-fg/30">
                {pick(`Show all ${list.length} projects`, `اعرض كل المشاريع (${list.length})`)}
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
