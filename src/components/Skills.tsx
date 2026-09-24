import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Folder, FolderOpen, GitBranch, Terminal } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  lang?: string;
  isDark?: boolean;
};

type Skill = {
  id: number | string;
  name_en: string;
  name_ar: string;
  desc_en?: string;
  desc_ar?: string;
  category: string;
  color?: string;
  years?: number;
};

const CATEGORIES = [
  { key: "All", folder: "", en: "All", ar: "الكل" },
  { key: "Frontend", folder: "frontend", en: "Frontend", ar: "الواجهات" },
  { key: "Design", folder: "design", en: "Design", ar: "التصميم" },
  { key: "Backend", folder: "backend", en: "Backend", ar: "الباك إند" },
  { key: "Tools", folder: "tools", en: "Tools", ar: "الأدوات" },
  { key: "Optimization", folder: "performance", en: "Performance", ar: "الأداء" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const DEFAULT_SKILLS: Skill[] = [
  { id: "d1", name_en: "React", name_ar: "React", desc_en: "Component architecture, hooks, state that stays predictable.", desc_ar: "تقسيم الكومبوننتس، الـ hooks، وإدارة state واضحة.", category: "Frontend", color: "#38bdf8", years: 3 },
  { id: "d2", name_en: "TypeScript", name_ar: "TypeScript", desc_en: "Typed props and API responses so bugs show up in the editor.", desc_ar: "تايبس للـ props والـ API عشان الأخطاء تبان في المحرر.", category: "Frontend", color: "#3b82f6", years: 2 },
  { id: "d3", name_en: "Next.js", name_ar: "Next.js", desc_en: "Routing, server rendering and image optimization.", desc_ar: "الراوتنج، الـ SSR، وتحسين الصور.", category: "Frontend", color: "#e2e8f0", years: 2 },
  { id: "d4", name_en: "Tailwind CSS", name_ar: "Tailwind CSS", desc_en: "Responsive layouts and design tokens without CSS drift.", desc_ar: "تصميم متجاوب بقواعد ثابتة من غير CSS عشوائي.", category: "Design", color: "#22d3ee", years: 3 },
  { id: "d5", name_en: "Figma", name_ar: "Figma", desc_en: "Reading designs and turning them into accurate UI.", desc_ar: "قراءة التصميم وتحويله لواجهة مطابقة.", category: "Design", color: "#f472b6", years: 2 },
  { id: "d6", name_en: "Supabase", name_ar: "Supabase", desc_en: "Postgres tables, auth and row-level security.", desc_ar: "جداول Postgres، تسجيل الدخول، وصلاحيات الصفوف.", category: "Backend", color: "#34d399", years: 1 },
  { id: "d7", name_en: "REST APIs", name_ar: "REST APIs", desc_en: "Fetching, caching and handling errors cleanly.", desc_ar: "جلب البيانات، الكاش، والتعامل مع الأخطاء.", category: "Backend", color: "#a78bfa", years: 3 },
  { id: "d8", name_en: "Git & GitHub", name_ar: "Git و GitHub", desc_en: "Small commits, pull requests, code review.", desc_ar: "commits صغيرة، pull requests، ومراجعة كود.", category: "Tools", color: "#fb923c", years: 3 },
  { id: "d9", name_en: "Lighthouse & Web Vitals", name_ar: "Lighthouse و Web Vitals", desc_en: "Measuring LCP and CLS, then fixing what's slow.", desc_ar: "قياس LCP وCLS وإصلاح اللي بطيء.", category: "Optimization", color: "#facc15", years: 2 },
];

export default function Skills({ lang = "EN", isDark = true }: Props) {
  const isArabic = lang === "AR";
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<CategoryKey>("All");
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("id", { ascending: true });
      if (error) {
        console.error("Skills:", error.message);
        return;
      }
      if (!cancelled && data && data.length > 0) setSkills(data as Skill[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: skills.length };
    for (const s of skills) c[s.category] = (c[s.category] || 0) + 1;
    return c;
  }, [skills]);

  const visibleCats = CATEGORIES.filter((c) => c.key === "All" || counts[c.key]);
  const filtered = active === "All" ? skills : skills.filter((s) => s.category === active);
  const activeCat = CATEGORIES.find((c) => c.key === active)!;
  const path = `~/portfolio/skills/${activeCat.folder}`;

  const t = {
    bg: isDark ? "bg-[#030712]" : "bg-[#f8fafc]",
    panel: isDark ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200",
    chrome: isDark ? "bg-[#070b16] border-slate-800" : "bg-slate-50 border-slate-200",
    heading: isDark ? "text-white" : "text-slate-900",
    body: isDark ? "text-slate-400" : "text-slate-600",
    muted: isDark ? "text-slate-500" : "text-slate-400",
    cardBg: isDark ? "bg-[#0f172a]/70 border-slate-800 hover:border-slate-700" : "bg-slate-50/80 border-slate-200 hover:border-slate-300",
  };

  return (
    <section
      id="skills"
      dir={isArabic ? "rtl" : "ltr"}
      className={`py-28 px-6 lg:px-20 transition-colors duration-500 ${t.bg}`}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* العناوين الجديدة المحسنة */}
        <div className="mb-14 max-w-2xl text-start">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs mb-4 border ${
            isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            <Terminal size={13} />
            <span>{isArabic ? "تجهيزات النظام والبنية التحتية" : "SYSTEM_STACK // CORE_TECH"}</span>
          </div>

          <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight mb-4 ${t.heading}`}>
            {isArabic ? "الترسانة التقنية ومحرك الأداء" : "Technical Arsenal & Core Stack"}
          </h2>
          
          <p className={`text-base md:text-lg leading-relaxed ${t.body}`}>
            {isArabic
              ? "ليست مجرد قائمة نظريات، بل الأدوات والتقنيات الحقيقية التي أعتمد عليها لهندسة وتطوير حلول برمجية استثنائية."
              : "Not just a list of concepts, but the production-grade tools and technologies I rely on to engineer exceptional digital products."}
          </p>
        </div>

        {/* واجهة المحرر */}
        <div className={`rounded-xl border overflow-hidden ${t.panel} ${isDark ? "shadow-[0_30px_80px_-30px_rgba(37,99,235,0.25)]" : "shadow-[0_30px_60px_-30px_rgba(15,23,42,0.2)]"}`}>
          {/* شريط العنوان */}
          <div className={`flex items-center gap-4 px-4 py-3 border-b ${t.chrome}`}>
            <div className="flex gap-1.5" aria-hidden dir="ltr">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span dir="ltr" className={`font-mono text-xs truncate ${t.muted}`}>
              {path}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[230px_1fr]">
            {/* مستكشف الملفات */}
            <nav
              aria-label={isArabic ? "تصنيفات المهارات" : "Skill categories"}
              className={`border-b md:border-b-0 md:border-e ${t.chrome}`}
            >
              <p className={`hidden md:block px-4 pt-4 pb-2 font-mono text-[11px] ${t.muted}`} dir="ltr">
                explorer
              </p>
              <div
                role="tablist"
                className="flex md:flex-col gap-1 p-2 md:pt-0 overflow-x-auto"
              >
                {visibleCats.map((c) => {
                  const isActive = c.key === active;
                  const Icon = isActive ? FolderOpen : Folder;
                  return (
                    <button
                      key={c.key}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActive(c.key)}
                      className={`flex items-center justify-between gap-3 shrink-0 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isActive
                          ? isDark
                            ? "bg-blue-500/15 text-white"
                            : "bg-blue-50 text-blue-800"
                          : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={15} className={isActive ? "text-blue-400" : t.muted} />
                        {isArabic ? c.ar : c.en}
                      </span>
                      <span className={`font-mono text-[11px] ${t.muted}`}>{counts[c.key] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* شبكة كروت المهارات */}
            <div role="tabpanel" className="p-5 min-h-[380px] flex flex-col">
              <p dir="ltr" className={`font-mono text-xs italic mb-4 ${t.muted} ${isArabic ? "text-right" : ""}`}>
                {`// ${filtered.length} ${filtered.length === 1 ? "skill" : "skills"}${activeCat.folder ? ` in ${activeCat.folder}/` : ""}`}
              </p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filtered.map((s, i) => {
                    const name = isArabic ? s.name_ar || s.name_en : s.name_en;
                    const desc = isArabic ? s.desc_ar || s.desc_en : s.desc_en;
                    const color = s.color || "#3b82f6";
                    return (
                      <div
                        key={s.id}
                        className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${t.cardBg}`}
                      >
                        {/* خط تلوين رفيع أعلى الكارت */}
                        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color }} />

                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} aria-hidden />
                              <h3 className={`font-semibold text-base ${t.heading}`}>{name}</h3>
                            </div>
                            <span dir="ltr" className={`font-mono text-[10px] ${t.muted}`}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {desc && <p className={`text-xs leading-relaxed mb-4 ${t.body}`}>{desc}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/20 mt-auto">
                          {active === "All" ? (
                            <span
                              dir="ltr"
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                                isDark ? "border-slate-800 text-slate-400 bg-slate-900/50" : "border-slate-200 text-slate-500 bg-slate-100"
                              }`}
                            >
                              {CATEGORIES.find((c) => c.key === s.category)?.folder || s.category.toLowerCase()}/
                            </span>
                          ) : <span />}

                          {typeof s.years === "number" && (
                            <span className={`font-mono text-[11px] ${t.muted}`}>
                              {isArabic ? `${s.years} سنين` : `${s.years} yr${s.years === 1 ? "" : "s"}`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* شريط الحالة */}
          <div dir="ltr" className="flex items-center justify-between px-4 py-1.5 bg-blue-600 text-white/90 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <GitBranch size="12" /> main
            </span>
            <span>{skills.length} skills</span>
          </div>
        </div>
      </div>
    </section>
  );
}