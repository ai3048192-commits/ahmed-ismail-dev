import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ExternalLink, FolderGit2, Lock, RotateCw, X, FileText, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

/* ================================================================== */
/*  الفكرة: الزائر مش محتاج يدوس على حاجة. بيعمل scroll عادي،          */
/*  والمعاينة اللي على اليمين بتتبدل لوحدها مع كل مشروع بيعدّي عليه.   */
/*  الأعمدة اللي عليها "اختياري" بتظهر تلقائي لو ضفتها في Supabase.    */
/* ================================================================== */
type Project = {
  id: number | string;
  name?: string;
  name_en?: string;
  name_ar?: string;
  desc?: string;
  desc_en?: string;
  desc_ar?: string;
  tags_en?: string[];
  tags_ar?: string[];
  category?: string;
  url?: string;
  image?: string;
  created_at?: string;
  repo_url?: string; // اختياري
  role_en?: string; // اختياري
  role_ar?: string;
  highlights_en?: string[]; // اختياري
  highlights_ar?: string[];
  problem_en?: string; // اختياري: case study
  problem_ar?: string;
  solution_en?: string;
  solution_ar?: string;
  result_en?: string;
  result_ar?: string;
  gallery?: string[]; // اختياري
};

type Props = { lang?: string; isDark?: boolean };
type Status = "loading" | "ready" | "error";

const CATEGORIES = [
  { key: "All", en: "All", ar: "الكل" },
  { key: "Dashboards", en: "Dashboards", ar: "لوحات التحكم" },
  { key: "E-Commerce", en: "E-commerce", ar: "المتاجر" },
  { key: "Platforms", en: "Platforms", ar: "المنصات" },
  { key: "Systems", en: "Systems", ar: "الأنظمة" },
  { key: "Applications", en: "Applications", ar: "التطبيقات" },
];

const SPRING = { type: "spring" as const, stiffness: 260, damping: 32, mass: 0.9 };

const hostOf = (url?: string) => {
  if (!url) return "localhost:3000";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const yearOf = (d?: string) => {
  const y = d ? new Date(d).getFullYear() : NaN;
  return Number.isNaN(y) ? null : y;
};
const pick = <T,>(ar: boolean, a?: T, e?: T, f?: T) => (ar ? a ?? e ?? f : e ?? f ?? a);
const pad = (n: number) => String(n).padStart(2, "0");
const hasCaseStudy = (p: Project) => Boolean(p.problem_en || p.solution_en || p.result_en || p.problem_ar);

function theme(isDark: boolean) {
  return {
    bg: isDark ? "bg-[#030712]" : "bg-[#f8fafc]",
    heading: isDark ? "text-white" : "text-slate-900",
    body: isDark ? "text-slate-400" : "text-slate-600",
    muted: isDark ? "text-slate-500" : "text-slate-400",
    frame: isDark ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200",
    chrome: isDark ? "bg-[#070b16] border-slate-800" : "bg-slate-50 border-slate-200",
    urlbar: isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 border border-slate-200",
    chip: isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600",
    line: isDark ? "border-slate-800" : "border-slate-200",
    track: isDark ? "bg-slate-800" : "bg-slate-200",
    accent: isDark ? "text-blue-400" : "text-blue-700",
    ghostBtn: isDark
      ? "border-slate-700 text-slate-200 hover:bg-slate-800/70"
      : "border-slate-300 text-slate-800 hover:bg-slate-50",
  };
}
type Theme = ReturnType<typeof theme>;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

/* ------------------------------ إطار المتصفح ------------------------------ */
function BrowserFrame({
  p,
  dir = 1,
  t,
  isDark,
  isArabic,
}: {
  p: Project;
  dir?: number;
  t: Theme;
  isDark: boolean;
  isArabic: boolean;
}) {
  const reduce = useReducedMotion();
  const title = pick(isArabic, p.name_ar, p.name_en, p.name) || "";

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: d * 48, scale: 0.97, filter: "blur(6px)" }),
    center: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: d * -48, scale: 0.97, filter: "blur(6px)" }),
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden ${t.frame} ${
        isDark ? "shadow-[0_40px_100px_-30px_rgba(37,99,235,0.35)]" : "shadow-[0_40px_80px_-35px_rgba(15,23,42,0.3)]"
      }`}
    >
      <div dir="ltr" className={`flex items-center gap-3 px-3 py-2 border-b ${t.chrome}`}>
        <div className="flex gap-1.5 shrink-0" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className={`relative flex-1 min-w-0 h-6 flex items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px] overflow-hidden ${t.urlbar}`}>
          <Lock size={10} className="shrink-0 opacity-70" />
          <div className="relative flex-1 h-full">
            <AnimatePresence initial={false} custom={dir}>
              <motion.span
                key={p.id}
                custom={dir}
                className="absolute inset-0 flex items-center truncate"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: dir * 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: dir * -10 }}
                transition={{ duration: 0.22 }}
              >
                {hostOf(p.url)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className={`relative aspect-[16/10] overflow-hidden ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={p.id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0.15 } : SPRING}
            className="absolute inset-0 will-change-transform"
          >
            {p.image ? (
              <img
                src={p.image}
                alt={isArabic ? `لقطة شاشة من ${title}` : `Screenshot of ${title}`}
                className="w-full h-full object-cover object-top"
                draggable={false}
              />
            ) : (
              <div dir="ltr" className={`w-full h-full flex items-center justify-center font-mono text-sm ${t.muted}`}>
                {"<"}
                <span className={isDark ? "text-yellow-200" : "text-amber-700"}>
                  {(p.name_en || p.name || "App").replace(/\s+/g, "")}
                </span>
                {" />"}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------ تفاصيل المشروع ------------------------------ */
function ProjectInfo({ p, t, isArabic, onOpenCase }: { p: Project; t: Theme; isArabic: boolean; onOpenCase?: () => void }) {
  const desc = pick(isArabic, p.desc_ar, p.desc_en, p.desc);
  const tags = pick(isArabic, p.tags_ar, p.tags_en) || [];
  const role = pick(isArabic, p.role_ar, p.role_en);
  const highlights = pick(isArabic, p.highlights_ar, p.highlights_en) || [];
  const year = yearOf(p.created_at);

  const meta = [
    role && { k: isArabic ? "دوري" : "Role", v: role },
    year && { k: isArabic ? "السنة" : "Year", v: String(year) },
    p.category && { k: isArabic ? "النوع" : "Type", v: p.category },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="text-start">
      {desc && <p className={`text-base leading-relaxed max-w-[58ch] ${t.body}`}>{desc}</p>}

      {highlights.length > 0 && (
        <ul className="mt-6 space-y-2.5">
          {highlights.slice(0, 3).map((h) => (
            <li key={h} className={`flex gap-3 text-sm leading-relaxed ${t.body}`}>
              <span className="mt-[0.6rem] h-px w-4 bg-blue-500 shrink-0" aria-hidden />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {meta.length > 0 && (
        <dl className={`grid grid-cols-3 gap-4 mt-7 pt-5 border-t max-w-md ${t.line}`}>
          {meta.map((m) => (
            <div key={m.k} className="min-w-0">
              <dt className={`text-xs mb-1 ${t.muted}`}>{m.k}</dt>
              <dd className={`text-sm font-medium truncate ${t.heading}`}>{m.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-6" aria-label={isArabic ? "التقنيات" : "Tech stack"}>
          {tags.map((tag) => (
            <li key={tag} className={`font-mono text-[11px] px-2 py-0.5 rounded border ${t.chip}`}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mt-8">
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors ${focusRing}`}
          >
            {isArabic ? "افتح الموقع" : "Open site"}
            <ExternalLink size={14} className="motion-safe:transition-transform group-hover/btn:-translate-y-0.5" />
          </a>
        )}
        {onOpenCase && hasCaseStudy(p) && (
          <button
            type="button"
            onClick={onOpenCase}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${t.ghostBtn} ${focusRing}`}
          >
            <FileText size={14} />
            {isArabic ? "إزاي اتعمل" : "How I built it"}
          </button>
        )}
        {p.repo_url && (
          <a
            href={p.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${t.ghostBtn} ${focusRing}`}
          >
            <FolderGit2 size={14} />
            {isArabic ? "الكود" : "Source code"}
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ الـ case study ------------------------------ */
function CaseStudySheet({
  p,
  t,
  isDark,
  isArabic,
  onClose,
}: {
  p: Project;
  t: Theme;
  isDark: boolean;
  isArabic: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = pick(isArabic, p.name_ar, p.name_en, p.name) || "";

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [onClose]);

  const sections = [
    { k: isArabic ? "المشكلة" : "The problem", v: pick(isArabic, p.problem_ar, p.problem_en) },
    { k: isArabic ? "اللي عملته" : "What I built", v: pick(isArabic, p.solution_ar, p.solution_en) },
    { k: isArabic ? "النتيجة" : "The result", v: pick(isArabic, p.result_ar, p.result_en) },
  ].filter((s) => s.v);
  const images = [p.image, ...(p.gallery || [])].filter(Boolean) as string[];
  const slide = isArabic ? "-100%" : "100%";

  return (
    <div className="fixed inset-0 z-[100]" dir={isArabic ? "rtl" : "ltr"}>
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        className={`absolute inset-y-0 end-0 w-full max-w-2xl overflow-y-auto overscroll-contain border-s ${t.frame}`}
        initial={reduce ? { opacity: 0 } : { x: slide }}
        animate={reduce ? { opacity: 1 } : { x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: slide }}
        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 36 }}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b ${t.chrome}`}>
          <span dir="ltr" className={`font-mono text-xs truncate ${t.muted}`}>
            ~/projects/{(p.name_en || p.name || "project").toLowerCase().replace(/\s+/g, "-")}/README.md
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
            className={`p-2 rounded-md ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"} ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 sm:px-10 py-10">
          <h3 id="case-title" className={`text-3xl font-bold tracking-tight mb-8 ${t.heading}`}>
            {title}
          </h3>
          {images[0] && <img src={images[0]} alt="" className={`w-full rounded-lg border mb-10 ${t.line}`} />}
          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.k}>
                <h4 className={`text-sm font-semibold mb-3 ${t.accent}`}>{s.k}</h4>
                <p className={`text-[15px] leading-[1.8] whitespace-pre-line max-w-[62ch] ${t.body}`}>{s.v}</p>
              </section>
            ))}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-3 mt-12">
              {images.slice(1).map((src) => (
                <img key={src} src={src} alt="" loading="lazy" className={`w-full rounded-lg border ${t.line}`} />
              ))}
            </div>
          )}
          <div className={`mt-12 pt-8 border-t ${t.line}`}>
            <ProjectInfo p={p} t={t} isArabic={isArabic} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================ السكشن ================================ */
export default function Projects({ lang = "EN", isDark = true }: Props) {
  const isArabic = lang === "AR";
  const reduce = useReducedMotion();
  const t = theme(isDark);

  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [caseId, setCaseId] = useState<Project["id"] | null>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);

  const load = useCallback(async () => {
    setStatus("loading");
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Projects:", error.message);
      setStatus("error");
      return;
    }
    const list = (data as Project[]) || [];
    setProjects(list);
    setStatus("ready");
    list.forEach((p) => {
      if (p.image) new Image().src = p.image;
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: projects.length };
    for (const p of projects) if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [projects]);

  const visibleCats = CATEGORIES.filter((c) => c.key === "All" || counts[c.key]);
  const list = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.category === filter)),
    [projects, filter]
  );
  const current = list[Math.min(active, list.length - 1)];
  const caseProject = projects.find((p) => p.id === caseId);
  const closeCase = useCallback(() => setCaseId(null), []);

  const goTo = useCallback((i: number) => {
    setDir(i >= activeRef.current ? 1 : -1);
    activeRef.current = i;
    setActive(i);
  }, []);

  useEffect(() => {
    if (status !== "ready" || list.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          if (i !== activeRef.current) goTo(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    stepRefs.current.slice(0, list.length).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [status, list, goTo]);

  const scrollToStep = (i: number) => {
    stepRefs.current[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  const changeFilter = (key: string) => {
    setFilter(key);
    activeRef.current = 0;
    setActive(0);
    setDir(1);
    document.getElementById("projects")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <section id="projects" dir={isArabic ? "rtl" : "ltr"} className={`relative py-28 px-6 lg:px-20 transition-colors duration-500 ${t.bg}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* العنوان والوصف بتصميم عصري وأنيق */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div className="max-w-xl text-start">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs mb-4 border backdrop-blur-md ${
              isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              <Sparkles size={13} />
              <span>{isArabic ? "معرض الأعمال البرمجية" : "FEATURED WORKS"}</span>
            </div>

            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight mb-4 ${t.heading}`}>
              {isArabic ? "مشاريع اشتغلت عليها وتفخر بها" : "Things I've built & shipped"}
            </h2>
            
            <p className={`text-base md:text-lg leading-relaxed ${t.body}`}>
              {isArabic
                ? "انزل بالـ scroll وكل مشروع هيظهر قدامك بتفاصيله. جميع التطبيقات والأنظمة حية ومتاحة للاستخدام."
                : "Scroll through to explore interactive project previews. All of them are live and production-ready."}
            </p>
          </div>

          {status === "ready" && visibleCats.length > 2 && (
            <div
              role="tablist"
              aria-label={isArabic ? "تصنيفات المشاريع" : "Project categories"}
              className={`relative flex gap-1 p-1 rounded-lg border overflow-x-auto max-w-full ${t.chrome}`}
            >
              {visibleCats.map((c) => {
                const on = c.key === filter;
                return (
                  <button
                    key={c.key}
                    role="tab"
                    aria-selected={on}
                    onClick={() => changeFilter(c.key)}
                    className={`relative shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${focusRing} ${
                      on ? t.heading : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="project-filter-pill"
                        className={`absolute inset-0 rounded-md ${isDark ? "bg-slate-800" : "bg-white shadow-sm"}`}
                        transition={reduce ? { duration: 0 } : SPRING}
                      />
                    )}
                    <span className="relative">{isArabic ? c.ar : c.en}</span>
                    <span className={`relative font-mono text-[11px] ${t.muted}`}>{counts[c.key] || 0}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {status === "error" && (
          <div className={`rounded-xl border p-10 text-center ${t.frame}`}>
            <p dir="ltr" className="font-mono text-sm text-red-400 mb-2">
              Error: couldn't load projects
            </p>
            <p className={`text-sm mb-6 ${t.body}`}>
              {isArabic ? "المشاريع ما اتحمّلتش. جرّب تاني بعد لحظة." : "The projects didn't load. Try again in a moment."}
            </p>
            <button
              type="button"
              onClick={load}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold ${focusRing}`}
            >
              <RotateCw size={14} />
              {isArabic ? "حمّل تاني" : "Try again"}
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="grid lg:grid-cols-2 gap-16 mt-12" aria-busy="true">
            <div className="space-y-4">
              <div className={`h-8 w-1/2 rounded motion-safe:animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <div className={`h-4 w-5/6 rounded motion-safe:animate-pulse ${isDark ? "bg-slate-800/70" : "bg-slate-200/70"}`} />
              <div className={`h-4 w-2/3 rounded motion-safe:animate-pulse ${isDark ? "bg-slate-800/70" : "bg-slate-200/70"}`} />
            </div>
            <div className={`aspect-[16/10] rounded-xl motion-safe:animate-pulse ${isDark ? "bg-slate-800/40" : "bg-slate-200/60"}`} />
          </div>
        )}

        {status === "ready" && list.length === 0 && (
          <div className={`rounded-xl border p-10 text-center ${t.frame}`}>
            <p className={`text-sm ${t.body}`}>{isArabic ? "لسه مفيش مشاريع هنا." : "No projects here yet."}</p>
          </div>
        )}

        {status === "ready" && current && (
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-10 lg:gap-16">
            <div>
              {list.map((p, i) => {
                const on = i === active;
                const title = pick(isArabic, p.name_ar, p.name_en, p.name) || "";
                return (
                  <article
                    key={p.id}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    data-index={i}
                    aria-current={on ? "true" : undefined}
                    className={`py-14 lg:py-0 lg:min-h-[78vh] flex flex-col justify-center border-b lg:border-0 last:border-0 ${t.line} lg:transition-opacity lg:duration-500 ${
                      on ? "lg:opacity-100" : "lg:opacity-25"
                    }`}
                  >
                    <div className="lg:hidden mb-8">
                      <BrowserFrame p={p} t={t} isDark={isDark} isArabic={isArabic} />
                    </div>

                    <span dir="ltr" className={`font-mono text-xs mb-3 ${isArabic ? "text-right" : ""} ${on ? t.accent : t.muted}`}>
                      {pad(i + 1)}
                    </span>
                    <h3 className={`text-3xl md:text-4xl font-bold tracking-tight mb-5 ${t.heading}`}>{title}</h3>
                    <ProjectInfo p={p} t={t} isArabic={isArabic} onOpenCase={() => setCaseId(p.id)} />
                  </article>
                );
              })}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-[calc(50vh-15rem)]">
                <BrowserFrame p={current} dir={dir} t={t} isDark={isDark} isArabic={isArabic} />

                <div className="mt-6 flex items-center gap-5">
                  <div dir="ltr" className={`font-mono text-xs tabular-nums shrink-0 ${t.muted}`}>
                    <span className={`inline-block min-w-[1.4em] ${t.heading}`}>{pad(active + 1)}</span>
                    <span> / {pad(list.length)}</span>
                  </div>
                  <div className={`relative h-px flex-1 ${t.track}`}>
                    <motion.div
                      className="absolute inset-y-0 start-0 w-full bg-blue-500"
                      style={{ transformOrigin: isArabic ? "right" : "left" }}
                      animate={{ scaleX: (active + 1) / list.length }}
                      transition={reduce ? { duration: 0 } : SPRING}
                    />
                  </div>
                  <div className="flex items-center gap-1.5" role="group" aria-label={isArabic ? "انتقل لمشروع" : "Jump to project"}>
                    {list.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => scrollToStep(i)}
                        aria-label={pick(isArabic, p.name_ar, p.name_en, p.name)}
                        aria-current={i === active ? "true" : undefined}
                        className={`relative h-2 rounded-full transition-[width] duration-300 ${focusRing} ${
                          i === active ? "w-6" : "w-2"
                        } ${t.track}`}
                      >
                        {i === active && (
                          <motion.span
                            layoutId="project-dot"
                            className="absolute inset-0 rounded-full bg-blue-500"
                            transition={reduce ? { duration: 0 } : SPRING}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {caseProject && <CaseStudySheet p={caseProject} t={t} isDark={isDark} isArabic={isArabic} onClose={closeCase} />}
      </AnimatePresence>
    </section>
  );
}