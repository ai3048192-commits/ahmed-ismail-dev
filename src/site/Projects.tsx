import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Project } from "../lib/types";
import { Reveal, Tilt } from "./Effects";
import { btn } from "./styles";
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

function Card({ p, label, className = "" }: { p: Project; label: (c: string) => string; className?: string }) {
  const { pick, isAr } = usePrefs();
  const { settings } = useSettings();
  const tags = (isAr && p.tags_ar.length ? p.tags_ar : p.tags_en).slice(0, 3);
  return (
    <Tilt enabled={settings.tilt_cards} max={4} className={`rounded-[1.75rem] ${className}`}>
      <article className="group glass relative h-full rounded-[1.75rem] p-3 flex flex-col transition-shadow duration-500 hover:shadow-[0_40px_90px_-40px_var(--accent)]">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-surface-2">
          <Cover p={p} className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {p.featured && <span className="absolute top-3 start-3 rounded-pill bg-grad text-white px-3 py-1 text-xs font-semibold">{pick("Featured", "مميز")}</span>}
          <span aria-hidden className="absolute bottom-3 end-3 grid h-11 w-11 place-items-center rounded-pill bg-white text-black opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
            <ArrowUpRight size={18} className="rtl:-scale-x-100" />
          </span>
        </div>
        <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
          <p className="text-xs text-faint">
            {label(p.category)}
            {p.year && <span> · {p.year}</span>}
          </p>
          <h3 className="mt-2 font-display text-2xl tracking-tight leading-tight">
            {/* the whole card is clickable through this link's overlay */}
            <Link to={`/work/${p.slug}`} className="after:absolute after:inset-0 after:rounded-[1.75rem]">
              {pick(p.name_en, p.name_ar)}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">{pick(p.desc_en, p.desc_ar)}</p>
          <div className="mt-auto pt-5 flex items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-1.5 min-w-0">
              {tags.map((t) => (
                <li key={t} className="rounded-pill bg-surface-2/80 px-2.5 py-1 text-[11px] text-muted truncate max-w-[10rem]">
                  {t}
                </li>
              ))}
            </ul>
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("project_link", p.name_en)}
                aria-label={pick("Open live site", "افتح الموقع")}
                className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line text-muted hover:text-fg hover:border-faint"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </article>
    </Tilt>
  );
}

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
        <motion.div ref={trackRef} style={{ x }} className="mt-8 flex w-max gap-5 px-5 sm:px-8 lg:ps-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {list.map((p) => (
            <Card key={p.id} p={p} label={label} className="w-[min(78vw,480px)] shrink-0" />
          ))}
        </motion.div>
        <div className="px-5 sm:px-8 max-w-7xl mx-auto w-full mt-8">
          <div className="h-1 rounded-full bg-line overflow-hidden">
            <motion.div className="h-full bg-grad origin-left rtl:origin-right" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const filters = (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={pick("Filter projects", "فلترة المشاريع")}>
      {categories.map((c) => (
        <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c} className={btn.chip(filter === c)}>
          {label(c)}
          <span className="ms-1.5 font-mono text-[10px] opacity-70">{c === "All" ? projects.length : projects.filter((p) => p.category === c).length}</span>
        </button>
      ))}
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
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 3) * 0.06}>
            <Card p={p} label={label} className="h-full" />
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
