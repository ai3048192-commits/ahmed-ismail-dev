import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Project } from "../lib/types";
import { Reveal, Tilt } from "./Effects";
import { Section, SectionHeading } from "./ui";
import { useMotionOK } from "./useMotionOK";

const CATEGORY_AR: Record<string, string> = {
  Applications: "التطبيقات",
  Dashboards: "لوحات التحكم",
  "E-Commerce": "المتاجر",
  Platforms: "المنصات",
  Systems: "الأنظمة",
};

export function Cover({ p, className = "" }: { p: Project; className?: string }) {
  return p.image ? (
    <img src={p.image} alt="" loading="lazy" className={`w-full h-full object-cover object-top ${className}`} />
  ) : (
    <div className={`w-full h-full grid place-items-center bg-surface-2 font-mono text-sm text-faint ${className}`} dir="ltr">
      {"<"}
      {p.name_en.replace(/\s+/g, "")}
      {" />"}
    </div>
  );
}

const hostOf = (url?: string | null) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/* ------------------------------------------------------------------ */
/* Card: screenshot in a small browser frame, details underneath       */
/* ------------------------------------------------------------------ */

function Card({ p, label, className = "" }: { p: Project; label: (c: string) => string; className?: string }) {
  const { pick, isAr } = usePrefs();
  const { settings } = useSettings();
  const tags = (isAr && p.tags_ar.length ? p.tags_ar : p.tags_en).slice(0, 3);
  const host = hostOf(p.url);

  return (
    <Tilt enabled={settings.tilt_cards} max={3} className={`rounded-3xl ${className}`}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,box-shadow] duration-300 hover:border-accent/60 hover:shadow-[0_30px_80px_-50px_var(--accent)]">
        {/* browser frame */}
        <div className="m-3 mb-0 overflow-hidden rounded-2xl border border-line bg-surface-2">
          <div className="flex h-8 items-center gap-1.5 border-b border-line px-3" dir="ltr" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-faint/40" />
            <span className="h-2 w-2 rounded-full bg-faint/40" />
            <span className="h-2 w-2 rounded-full bg-faint/40" />
            <span className="mx-auto max-w-[65%] truncate text-[11px] text-faint">{host || p.name_en}</span>
            <span className="w-[42px]" />
          </div>
          <div className="relative aspect-[16/10] overflow-hidden">
            <Cover p={p} className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
          </div>
        </div>

        {/* details */}
        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-faint">
            <span>{label(p.category)}</span>
            {p.year && <span className="tabular-nums">{p.year}</span>}
            {p.featured && (
              <span className="rounded-pill border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-ink">{pick("Featured", "مميز")}</span>
            )}
          </div>

          <h3 className="mt-3 font-display text-2xl tracking-tight leading-tight">
            {/* the whole card is clickable through this link's overlay */}
            <Link to={`/work/${p.slug}`} className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent">
              {pick(p.name_en, p.name_ar)}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{pick(p.desc_en, p.desc_ar)}</p>

          {tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t} className="max-w-[10rem] truncate rounded-pill border border-line px-2.5 py-1 text-[11px] text-muted">
                  {t}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              {pick("View project", "شوف المشروع")}
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
            </span>
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("project_link", p.name_en)}
                aria-label={pick("Open live site", "افتح الموقع")}
                title={pick("Open live site", "افتح الموقع")}
                className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line text-muted hover:border-faint hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
          </div>
        </div>
      </article>
    </Tilt>
  );
}

/* ------------------------------------------------------------------ */
/* Pinned horizontal gallery (wide screens, motion allowed)            */
/* ------------------------------------------------------------------ */

/** vertical scrolling drives the gallery sideways while the section is pinned */
function HorizontalGallery({ list, label, header }: { list: Project[]; label: (c: string) => string; header: React.ReactNode }) {
  const { isAr } = usePrefs();
  const wrap = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, (isAr ? 1 : -1) * distance]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 64));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [list]);

  return (
    <div ref={wrap} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-5 sm:px-8 max-w-7xl mx-auto w-full">{header}</div>
        <motion.div ref={trackRef} style={{ x }} className="mt-8 flex w-max items-stretch gap-5 px-5 sm:px-8 lg:ps-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {list.map((p) => (
            <Card key={p.id} p={p} label={label} className="w-[min(78vw,460px)] shrink-0" />
          ))}
        </motion.div>
        <div className="px-5 sm:px-8 max-w-7xl mx-auto w-full mt-8">
          <div className="h-1 rounded-full bg-line overflow-hidden">
            <motion.div className="h-full bg-accent origin-left rtl:origin-right" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function Projects({ projects, index }: { projects: Project[]; index: string }) {
  const { pick, isAr } = usePrefs();
  const motionOK = useMotionOK();
  const [filter, setFilter] = useState("All");
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category).filter(Boolean))], [projects]);
  // featured projects first, then the dashboard order
  const sorted = useMemo(() => [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)), [projects]);
  const list = filter === "All" ? sorted : sorted.filter((p) => p.category === filter);
  const label = (c: string) => (c === "All" ? pick("All", "الكل") : isAr ? CATEGORY_AR[c] || c : c);
  const countOf = (c: string) => (c === "All" ? projects.length : projects.filter((p) => p.category === c).length);

  // segmented control: one bordered bar, the active option is filled
  const filters = (
    <div className="flex justify-center">
      <div
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1"
        role="group"
        aria-label={pick("Filter projects", "فلترة المشاريع")}
      >
        {categories.map((c) => {
          const on = filter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              aria-pressed={on}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                on ? "bg-fg font-medium text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {label(c)}
              <span className={`min-w-5 rounded-pill px-1.5 text-center text-[11px] tabular-nums ${on ? "bg-bg/20" : "bg-surface-2 text-faint"}`}>{countOf(c)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (wide && motionOK && list.length > 2) {
    return (
      <section id="work" className="relative">
        <div className="px-5 sm:px-8 pt-24 md:pt-32">
          <SectionHeading section="work" index={index} />
        </div>
        <HorizontalGallery list={list} label={label} header={filters} />
      </section>
    );
  }

  return (
    <Section id="work">
      <SectionHeading section="work" index={index} />
      <div className="mb-10">{filters}</div>
      {list.length === 0 ? (
        <p className="py-16 text-center text-muted">{pick("No projects in this category yet.", "مفيش مشاريع في القسم ده لسه.")}</p>
      ) : (
        <ul className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 0.06}>
              <Card p={p} label={label} className="h-full" />
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}