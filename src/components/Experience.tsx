import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { Award, GraduationCap, Eye, X, ChevronLeft, ChevronRight, ExternalLink, RotateCw, ZoomIn, ZoomOut, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  lang?: "EN" | "AR";
  isDark?: boolean;
};

type EducationItem = {
  id: number;
  type: string; // "education" أو أي حاجة تانية = شهادة
  title_ar: string;
  title_en: string;
  org_ar: string;
  org_en: string;
  period: string;
  badge_ar: string;
  badge_en: string;
  image?: string;
  desc_ar: string;
  desc_en: string;
  verify_url?: string; // اختياري: رابط التحقق من الشهادة (Coursera, Udemy, ...)
};

type Status = "loading" | "ready" | "error";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 34 };
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

const slug = (s: string) =>
  (s || "credential").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "credential";

function theme(isDark: boolean) {
  return {
    bg: isDark ? "bg-[#030712]" : "bg-[#f8fafc]",
    heading: isDark ? "text-white" : "text-slate-900",
    body: isDark ? "text-slate-400" : "text-slate-600",
    muted: isDark ? "text-slate-500" : "text-slate-400",
    accent: isDark ? "text-blue-400" : "text-blue-700",
    frame: isDark ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200",
    chrome: isDark ? "bg-[#070b16] border-slate-800" : "bg-slate-50 border-slate-200",
    line: isDark ? "border-slate-800" : "border-slate-200",
    rail: isDark ? "bg-slate-800" : "bg-slate-200",
    hover: isDark ? "hover:bg-slate-800/40" : "hover:bg-white",
    iconBtn: isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100",
    ghostBtn: isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800/70" : "border-slate-300 text-slate-800 hover:bg-slate-50",
  };
}
type Theme = ReturnType<typeof theme>;

export default function Education({ lang = "EN", isDark = true }: Props) {
  const isArabic = lang === "AR";
  const reduce = useReducedMotion();
  const t = theme(isDark);

  const [items, setItems] = useState<EducationItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [openId, setOpenId] = useState<number | null>(null);
  // العنصر اللي اتفتح منه العارض: النافذة بتتمدد منه وبترجعله لما تتقفل
  const [originId, setOriginId] = useState<number | null>(null);
  const open = (id: number) => {
    setOriginId(id);
    setOpenId(id);
  };

  const load = useCallback(async () => {
    setStatus("loading");
    const { data, error } = await supabase.from("education").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Education:", error.message);
      setStatus("error");
      return;
    }
    setItems((data as EducationItem[]) || []);
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const L = useCallback(
    (item: EducationItem) => ({
      title: (isArabic ? item.title_ar || item.title_en : item.title_en || item.title_ar) || "",
      org: (isArabic ? item.org_ar || item.org_en : item.org_en || item.org_ar) || "",
      badge: (isArabic ? item.badge_ar || item.badge_en : item.badge_en || item.badge_ar) || "",
      desc: (isArabic ? item.desc_ar || item.desc_en : item.desc_en || item.desc_ar) || "",
    }),
    [isArabic]
  );

  const education = useMemo(() => items.filter((i) => i.type === "education"), [items]);
  const certificates = useMemo(() => items.filter((i) => i.type !== "education"), [items]);
  // بس اللي ليهم صورة يتفتحوا، وبنفس ترتيب ظهورهم في الصفحة
  const viewable = useMemo(() => [...education, ...certificates].filter((i) => i.image), [education, certificates]);
  const openItem = viewable.find((i) => i.id === openId) || null;

  const close = useCallback(() => {
    setOpenId(null);
    setOriginId(null);
  }, []);

  return (
    <section id="experience" dir={isArabic ? "rtl" : "ltr"} className={`py-28 px-6 lg:px-20 transition-colors duration-500 ${t.bg}`}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-16 text-start">
          <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${t.heading}`}>
            {isArabic ? "الدراسة والشهادات" : "Education & certificates"}
          </h2>
          <p className={`text-base leading-relaxed ${t.body}`}>
            {isArabic
              ? "اضغط على أي عنصر عليه علامة العين عشان تشوف الشهادة نفسها."
              : "Select anything marked with an eye to see the actual certificate."}
          </p>
        </div>

        {status === "loading" && (
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-14" aria-busy="true">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-20 rounded-lg motion-safe:animate-pulse ${isDark ? "bg-slate-800/50" : "bg-slate-200/70"}`} />
                ))}
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className={`rounded-xl border p-10 text-center ${t.frame}`}>
            <p dir="ltr" className="font-mono text-sm text-red-400 mb-2">Error: couldn't load credentials</p>
            <p className={`text-sm mb-6 ${t.body}`}>{isArabic ? "البيانات ما اتحمّلتش. جرّب تاني." : "The data didn't load. Try again."}</p>
            <button type="button" onClick={load} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold ${focusRing}`}>
              <RotateCw size={14} />
              {isArabic ? "حمّل تاني" : "Try again"}
            </button>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className={`rounded-xl border p-10 text-center ${t.frame}`}>
            <p className={`text-sm ${t.body}`}>{isArabic ? "لسه مفيش حاجة مضافة هنا." : "Nothing added here yet."}</p>
          </div>
        )}

        {status === "ready" && items.length > 0 && (
          <LayoutGroup>
            <div className={`grid gap-16 ${education.length && certificates.length ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
              {/* ---------------- الدراسة: timeline زي git log ---------------- */}
              {education.length > 0 && (
                <div>
                  <GroupTitle icon={<GraduationCap size={16} />} label={isArabic ? "الدراسة" : "Education"} count={education.length} t={t} />
                  <ol className="relative">
                    <span aria-hidden className={`absolute top-3 bottom-3 start-[7px] w-px ${t.rail}`} />
                    {education.map((item, i) => {
                      const d = L(item);
                      return (
                        <li key={item.id} className="relative ps-9 pb-2 last:pb-0">
                          <span
                            aria-hidden
                            className={`absolute start-0 top-[1.4rem] h-[15px] w-[15px] rounded-full border-2 ${
                              i === 0 ? "border-blue-500 bg-blue-500/20" : isDark ? "border-slate-600 bg-[#030712]" : "border-slate-300 bg-[#f8fafc]"
                            }`}
                          />
                          <EntryShell item={item} isOpen={originId === item.id} onOpen={() => open(item.id)} t={t} isArabic={isArabic}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span dir="ltr" className={`font-mono text-xs ${i === 0 ? t.accent : t.muted}`}>{item.period}</span>
                              {i === 0 && (
                                <span dir="ltr" className={`font-mono text-[10px] px-1.5 py-px rounded border ${isDark ? "border-blue-500/40 text-blue-400" : "border-blue-300 text-blue-700"}`}>
                                  HEAD
                                </span>
                              )}
                            </div>
                            <h4 className={`font-semibold text-lg leading-snug ${t.heading}`}>{d.title}</h4>
                            <p className={`text-sm mt-1 ${t.accent}`}>{d.org}</p>
                            {d.desc && <p className={`text-sm leading-relaxed mt-3 line-clamp-3 max-w-[55ch] ${t.body}`}>{d.desc}</p>}
                          </EntryShell>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* ---------------- الشهادات ---------------- */}
              {certificates.length > 0 && (
                <div>
                  <GroupTitle icon={<Award size={16} />} label={isArabic ? "الشهادات" : "Certificates"} count={certificates.length} t={t} />
                  <ul className={`border-t ${t.line}`}>
                    {certificates.map((item) => {
                      const d = L(item);
                      return (
                        <li key={item.id} className={`border-b ${t.line}`}>
                          <EntryShell item={item} isOpen={originId === item.id} onOpen={() => open(item.id)} t={t} isArabic={isArabic} flat>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h4 className={`font-semibold text-base leading-snug ${t.heading}`}>{d.title}</h4>
                                <p className={`text-sm mt-1 ${t.body}`}>{d.org}</p>
                              </div>
                              <div className="shrink-0 text-end">
                                <span dir="ltr" className={`block font-mono text-xs ${t.muted}`}>{item.period}</span>
                                {d.badge && <span className={`block text-xs mt-1 ${t.accent}`}>{d.badge}</span>}
                              </div>
                            </div>
                          </EntryShell>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <AnimatePresence>
              {openItem && (
                <CredentialViewer
                  key="viewer"
                  item={openItem}
                  layoutKey={originId ?? openItem.id}
                  data={L(openItem)}
                  index={viewable.indexOf(openItem)}
                  total={viewable.length}
                  onNavigate={(dir) => {
                    const i = viewable.indexOf(openItem);
                    const next = viewable[(i + dir + viewable.length) % viewable.length];
                    setOpenId(next.id);
                  }}
                  onClose={close}
                  t={t}
                  isDark={isDark}
                  isArabic={isArabic}
                  reduce={!!reduce}
                />
              )}
            </AnimatePresence>
          </LayoutGroup>
        )}
      </div>
    </section>
  );
}

/* ------------------------------ عنوان المجموعة ------------------------------ */
function GroupTitle({ icon, label, count, t }: { icon: React.ReactNode; label: string; count: number; t: Theme }) {
  return (
    <div className={`flex items-center gap-2 mb-6 ${t.muted}`}>
      {icon}
      <h3 className={`text-sm font-semibold ${t.heading}`}>{label}</h3>
      <span className="font-mono text-xs">{count}</span>
    </div>
  );
}

/* --------------- الصف: زرار لو ليه صورة، وعنصر عادي لو مالوش --------------- */
function EntryShell({
  item,
  isOpen,
  onOpen,
  t,
  isArabic,
  flat,
  children,
}: {
  item: EducationItem;
  isOpen: boolean;
  onOpen: () => void;
  t: Theme;
  isArabic: boolean;
  flat?: boolean;
  children: React.ReactNode;
}) {
  const pad = flat ? "py-5 px-3" : "p-4";
  if (!item.image) return <div className={`relative ${pad}`}>{children}</div>;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={`group relative w-full text-start rounded-lg ${pad} ${focusRing}`}
    >
      {/* الخلفية دي هي اللي بتتمدد وتبقى نافذة العرض */}
      {!isOpen && (
        <motion.span
          layoutId={`cred-${item.id}`}
          className={`absolute inset-0 rounded-lg border border-transparent transition-colors ${t.hover} group-hover:border-slate-700/40`}
          transition={SPRING}
        />
      )}
      <span className="relative flex items-start gap-4">
        <span className="flex-1 min-w-0">{children}</span>
        <span
          className={`shrink-0 mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity ${t.accent}`}
        >
          <Eye size={14} />
          <span className="hidden sm:inline">{isArabic ? "عرض" : "View"}</span>
        </span>
      </span>
    </button>
  );
}

/* ------------------------------ نافذة عرض الشهادة ------------------------------ */
function CredentialViewer({
  item,
  layoutKey,
  data,
  index,
  total,
  onNavigate,
  onClose,
  t,
  isDark,
  isArabic,
  reduce,
}: {
  item: EducationItem;
  layoutKey: number;
  data: { title: string; org: string; badge: string; desc: string };
  index: number;
  total: number;
  onNavigate: (dir: 1 | -1) => void;
  onClose: () => void;
  t: Theme;
  isDark: boolean;
  isArabic: boolean;
  reduce: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    setZoomed(false);
    setLoaded(false);
  }, [item.id]);

  const go = useCallback(
    (d: 1 | -1) => {
      setDir(d);
      onNavigate(d);
    },
    [onNavigate]
  );

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total < 2) return;
      // في العربي الاتجاهات بتتعكس: السهم الشمال = التالي
      if (e.key === "ArrowRight") go(isArabic ? -1 : 1);
      if (e.key === "ArrowLeft") go(isArabic ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go, total, isArabic]);

  const Prev = isArabic ? ChevronRight : ChevronLeft;
  const Next = isArabic ? ChevronLeft : ChevronRight;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" dir={isArabic ? "rtl" : "ltr"}>
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      <motion.div
        layoutId={reduce ? undefined : `cred-${layoutKey}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cred-title"
        transition={SPRING}
        initial={reduce ? { opacity: 0 } : undefined}
        animate={reduce ? { opacity: 1 } : undefined}
        exit={reduce ? { opacity: 0 } : undefined}
        className={`relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-xl border overflow-hidden ${t.frame} ${
          isDark ? "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]" : "shadow-2xl"
        }`}
      >
        {/* المحتوى بيظهر بعد ما الإطار يتمدد، عشان النص ما يتمطّش */}
        <motion.div
          className="flex flex-col min-h-0 flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: reduce ? 0 : 0.12, duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {/* شريط العنوان */}
          <div className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b ${t.chrome}`}>
            <div dir="ltr" className="flex gap-1.5 shrink-0" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span dir="ltr" className={`flex-1 min-w-0 truncate font-mono text-xs ${t.muted}`}>
              ~/credentials/{slug(item.title_en)}.png
            </span>

            {total > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => go(-1)} aria-label={isArabic ? "السابق" : "Previous"} className={`p-1.5 rounded-md ${t.iconBtn} ${focusRing}`}>
                  <Prev size={16} />
                </button>
                <span dir="ltr" className={`font-mono text-xs tabular-nums px-1 ${t.muted}`}>
                  {index + 1} / {total}
                </span>
                <button type="button" onClick={() => go(1)} aria-label={isArabic ? "التالي" : "Next"} className={`p-1.5 rounded-md ${t.iconBtn} ${focusRing}`}>
                  <Next size={16} />
                </button>
              </div>
            )}

            <button type="button" onClick={() => setZoomed((z) => !z)} aria-label={zoomed ? (isArabic ? "تصغير" : "Zoom out") : isArabic ? "تكبير" : "Zoom in"} className={`hidden sm:inline-flex p-1.5 rounded-md ${t.iconBtn} ${focusRing}`}>
              {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label={isArabic ? "إغلاق" : "Close"} className={`p-1.5 rounded-md ${t.iconBtn} ${focusRing}`}>
              <X size={16} />
            </button>
          </div>

          {/* الصورة */}
          <div className={`relative flex-1 min-h-[240px] ${zoomed ? "overflow-auto" : "overflow-hidden"} ${isDark ? "bg-[#050914]" : "bg-slate-100"}`}>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-2/3 aspect-[4/3] max-h-[60%] rounded-lg motion-safe:animate-pulse ${isDark ? "bg-slate-800/60" : "bg-slate-200"}`} />
              </div>
            )}
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={item.id}
                custom={dir}
                variants={{
                  enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: (isArabic ? -1 : 1) * d * 40 }),
                  exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: (isArabic ? 1 : -1) * d * 40 }),
                }}
                initial="enter"
                animate={{ opacity: loaded ? 1 : 0, x: 0 }}
                exit="exit"
                transition={reduce ? { duration: 0.15 } : SPRING}
                className={`flex p-4 sm:p-8 ${zoomed ? "min-w-full w-max" : "h-full items-center justify-center"}`}
              >
                <img
                  src={item.image}
                  alt={isArabic ? `شهادة ${data.title}` : `${data.title} certificate`}
                  onLoad={() => setLoaded(true)}
                  onClick={() => setZoomed((z) => !z)}
                  className={`rounded-md shadow-2xl select-none ${
                    zoomed ? "max-w-none w-[160%] sm:w-[1600px] cursor-zoom-out" : "max-h-[58vh] w-auto max-w-full object-contain cursor-zoom-in"
                  }`}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* التفاصيل */}
          <div className={`px-5 sm:px-6 py-5 border-t ${t.line}`}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              <div className="min-w-0 text-start">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span dir="ltr" className={`font-mono text-xs ${t.muted}`}>{item.period}</span>
                  {data.badge && <span className={`text-xs font-medium ${t.accent}`}>{data.badge}</span>}
                </div>
                <h3 id="cred-title" className={`text-xl font-bold tracking-tight ${t.heading}`}>{data.title}</h3>
                <p className={`text-sm mt-0.5 ${t.body}`}>{data.org}</p>
                {data.desc && <p className={`text-sm leading-relaxed mt-3 max-w-[65ch] ${t.body}`}>{data.desc}</p>}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {item.verify_url && (
                  <a href={item.verify_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors ${focusRing}`}>
                    <ShieldCheck size={15} />
                    {isArabic ? "اتحقق من الشهادة" : "Verify certificate"}
                  </a>
                )}
                <a href={item.image} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${t.ghostBtn} ${focusRing}`}>
                  <ExternalLink size={14} />
                  {isArabic ? "افتح بالحجم الكامل" : "Open full size"}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}