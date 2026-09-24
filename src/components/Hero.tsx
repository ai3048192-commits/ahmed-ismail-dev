import { motion, useReducedMotion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { GitBranch, FileCode, Terminal, Code2, Send, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  lang?: string;
  isDark?: boolean;
};

type HeroRow = {
  title?: string;
  title_en?: string;
  title_ar?: string;
  description?: string;
  description_en?: string;
  description_ar?: string;
};

type TokType = "kw" | "str" | "prop" | "punc" | "bool" | "fn" | "com" | "plain";
type Line = [TokType, string][];

const FILES: Record<string, Line[]> = {
  "developer.ts": [
    [["com", "// the person behind this portfolio"]],
    [["kw", "const "], ["plain", "developer"], ["punc", " = {"]],
    [["prop", "  name"], ["punc", ": "], ["str", '"Ahmed Ismail"'], ["punc", ","]],
    [["prop", "  role"], ["punc", ": "], ["str", '"Frontend Architect"'], ["punc", ","]],
    [["prop", "  stack"], ["punc", ": ["], ["str", '"React"'], ["punc", ", "], ["str", '"Next.js"'], ["punc", ", "], ["str", '"TypeScript"'], ["punc", "],"]],
    [["prop", "  backend"], ["punc", ": ["], ["str", '"Supabase"'], ["punc", ", "], ["str", '"REST"'], ["punc", "],"]],
    [["prop", "  openToWork"], ["punc", ": "], ["bool", "true"], ["punc", ","]],
    [["punc", "};"]],
    [],
    [["kw", "export function "], ["fn", "hire"], ["punc", "() {"]],
    [["kw", "  return "], ["plain", "developer.openToWork"]],
    [["punc", "    ? "], ["str", '"let\'s build something"']],
    [["punc", "    : "], ["str", '"check back soon"'], ["punc", ";"]],
    [["punc", "}"]],
  ],
  "Button.tsx": [
    [["kw", "type "], ["plain", "Props"], ["punc", " = { "], ["prop", "label"], ["punc", ": "], ["kw", "string"], ["punc", "; "], ["prop", "onClick"], ["punc", ": () => "], ["kw", "void"], ["punc", " };"]],
    [],
    [["kw", "export const "], ["fn", "Button"], ["punc", " = ({ "], ["plain", "label, onClick"], ["punc", " }: "], ["plain", "Props"], ["punc", ") => ("]],
    [["punc", "  <"], ["fn", "button"]],
    [["prop", "    type"], ["punc", "="], ["str", '"button"']],
    [["prop", "    onClick"], ["punc", "={"], ["plain", "onClick"], ["punc", "}"]],
    [["prop", "    className"], ["punc", "="], ["str", '"rounded-2xl px-6 py-3.5 transition-all"']],
    [["punc", "  >"]],
    [["punc", "    {"], ["plain", "label"], ["punc", "}"]],
    [["punc", "  </"], ["fn", "button"], ["punc", ">"]],
    [["punc", ");"]],
  ],
};

const TOKEN_DARK: Record<TokType, string> = {
  kw: "text-indigo-400",
  str: "text-emerald-400",
  prop: "text-sky-300",
  punc: "text-slate-500",
  bool: "text-amber-400",
  fn: "text-yellow-200",
  com: "text-slate-500 italic",
  plain: "text-slate-200",
};

const TOKEN_LIGHT: Record<TokType, string> = {
  kw: "text-indigo-700",
  str: "text-emerald-700",
  prop: "text-sky-700",
  punc: "text-slate-400",
  bool: "text-amber-700",
  fn: "text-amber-800",
  com: "text-slate-400 italic",
  plain: "text-slate-800",
};

const TERMINAL_LINES = [
  { t: "$ npm run build", tone: "cmd" },
  { t: "✓ compiled successfully", tone: "ok" },
  { t: "✓ ready — open to new projects", tone: "ok" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function Hero({ lang = "EN", isDark = true }: Props) {
  const isArabic = lang === "AR";
  const reduceMotion = useReducedMotion();

  const [heroData, setHeroData] = useState<HeroRow | null>(null);
  const [activeFile, setActiveFile] = useState<keyof typeof FILES>("developer.ts");
  const lines = FILES[activeFile];
  const [shown, setShown] = useState(reduceMotion ? lines.length : 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("title, title_en, title_ar, description, description_en, description_ar")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && !error && data) setHeroData(data as HeroRow);
      if (error) console.error("Hero content:", error.message);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setShown(lines.length);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= lines.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 95);
    return () => window.clearInterval(id);
  }, [activeFile, reduceMotion, lines.length]);

  const title = isArabic
    ? heroData?.title_ar || heroData?.title || "بكتب واجهات ويب سريعة، واضحة، وسهلة الصيانة."
    : heroData?.title_en || heroData?.title || "I build web interfaces that load fast and stay easy to change.";

  const description = isArabic
    ? heroData?.description_ar ||
      heroData?.description ||
      "مطور Frontend بشتغل بـ React وNext.js وTypeScript، ومعاها Supabase للباك إند. بحب الكود اللي أي حد في الفريق يقدر يقراه ويعدّل عليه."
    : heroData?.description_en ||
      heroData?.description ||
      "Frontend developer working in React, Next.js and TypeScript, with Supabase on the backend. I write code the rest of the team can read and change without fear.";

  const tok = isDark ? TOKEN_DARK : TOKEN_LIGHT;
  const typingDone = shown >= lines.length;
  const cursorLine = typingDone ? lines.length - 1 : Math.max(shown - 1, 0);
  const gridColor = isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.06)";

  return (
    <section
      id="home"
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative min-h-[85vh] w-full flex items-center px-6  py-16 overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#030712] text-white" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
        {/* النص */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 flex flex-col items-start text-start"
        >
          <div
            dir="ltr"
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border font-mono text-xs mb-7 shadow-sm ${
              isDark ? "border-indigo-500/30 bg-indigo-950/30 text-indigo-300" : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>
              <span className={isDark ? "text-indigo-400/70" : "text-indigo-400"}>~/portfolio $</span>{" "}
              {isArabic ? "متاح لمشاريع ووظائف Frontend" : "available for frontend roles"}
            </span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.1] mb-6 max-w-[18ch] ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </h1>

          <p
            className={`text-base sm:text-lg leading-relaxed mb-10 max-w-[52ch] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {description}
          </p>

          {/* الأزرار بالإيقونات الصحيحة والمعبرة */}
          <div className="flex flex-wrap items-center gap-4">
            {/* زر المشاريع - أيقونة Code2 تدل على الأكواد والمشاريع */}
            <motion.button
              type="button"
              onClick={() => scrollToId("projects")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all cursor-pointer border border-white/20"
            >
              <Code2 size={18} className="transition-transform duration-300 group-hover:rotate-12" />
              <span>{isArabic ? "شوف المشاريع" : "See my projects"}</span>
            </motion.button>

            {/* زر التواصل - أيقونة Send تدل على إرسال رسالة أو التواصل */}
            <motion.button
              type="button"
              onClick={() => scrollToId("contact")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border text-sm font-bold transition-all cursor-pointer backdrop-blur-md ${
                isDark
                  ? "border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80 hover:border-indigo-500/50 shadow-lg"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-indigo-300 shadow-sm"
              }`}
            >
              <Send size={16} className="text-indigo-500 transition-transform duration-300 group-hover:translate-x-0.5" />
              <span>{isArabic ? "تواصل معايا" : "Contact me"}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* المحرر البرمجي */}
        <motion.div
          dir="ltr"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`lg:col-span-6 w-full rounded-2xl border overflow-hidden text-left ${
            isDark
              ? "bg-[#0b1120] border-indigo-500/20 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.25)]"
              : "bg-white border-slate-200 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.25)]"
          }`}
        >
          <div className={`flex items-end gap-4 px-4 pt-3 border-b ${isDark ? "border-slate-800 bg-[#070b16]" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex gap-1.5 pb-3" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div role="tablist" aria-label="Code files" className="flex">
              {(Object.keys(FILES) as (keyof typeof FILES)[]).map((f) => {
                const active = f === activeFile;
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFile(f)}
                    className={`flex items-center gap-2 px-3.5 py-2 font-mono text-xs border-x border-t rounded-t-lg -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      active
                        ? isDark
                          ? "bg-[#0b1120] border-indigo-500/30 text-indigo-300"
                          : "bg-white border-slate-200 text-indigo-700 font-semibold"
                        : isDark
                        ? "border-transparent text-slate-500 hover:text-slate-300"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileCode size={13} className={f.endsWith(".tsx") ? "text-sky-400" : "text-indigo-400"} />
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <pre
            role="tabpanel"
            aria-label={`${activeFile} source`}
            className="font-mono text-[12.5px] sm:text-[13px] leading-[1.75] py-4 overflow-x-auto"
          >
            <code>
              {lines.map((line, i) => (
                <div
                  key={`${activeFile}-${i}`}
                  className={`flex transition-opacity duration-150 ${i < shown ? "opacity-100" : "opacity-0"}`}
                >
                  <span
                    aria-hidden
                    className={`select-none w-11 shrink-0 text-right pr-4 ${
                      i === cursorLine ? (isDark ? "text-slate-400" : "text-slate-600") : isDark ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-pre pr-6">
                    {line.map(([type, text], j) => (
                      <span key={j} className={tok[type]}>
                        {text}
                      </span>
                    ))}
                    {i === cursorLine && (
                      <span
                        aria-hidden
                        className={`inline-block w-[7px] h-[1.05em] align-[-2px] ml-0.5 ${
                          isDark ? "bg-indigo-400" : "bg-indigo-600"
                        } ${typingDone ? "motion-safe:animate-pulse" : ""}`}
                      />
                    )}
                  </span>
                </div>
              ))}
            </code>
          </pre>

          <div className={`border-t font-mono text-xs px-4 py-3 space-y-1 ${isDark ? "border-slate-800 bg-[#070b16]" : "border-slate-200 bg-slate-50"}`}>
            <div className={`flex items-center gap-2 mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Terminal size={12} />
              <span>terminal</span>
            </div>
            {TERMINAL_LINES.map((l, i) => (
              <div
                key={l.t}
                className={`transition-opacity duration-300 ${
                  typingDone ? "opacity-100" : "opacity-0"
                } ${l.tone === "ok" ? "text-emerald-500" : isDark ? "text-slate-300" : "text-slate-700"}`}
                style={{ transitionDelay: typingDone && !reduceMotion ? `${i * 180}ms` : "0ms" }}
              >
                {l.t}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white/95 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <GitBranch size={12} /> main
            </span>
            <span>
              {activeFile.endsWith(".tsx") ? "TypeScript React" : "TypeScript"} &nbsp; Ln {cursorLine + 1}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}