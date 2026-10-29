import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Megaphone, Menu, Moon, Sun, X } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { SectionId } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import type { Profile } from "../lib/types";
import { Magnetic } from "./Effects";
import { btn } from "./styles";

const LABELS: Record<SectionId, { en: string; ar: string }> = {
  services: { en: "Services", ar: "الخدمات" },
  work: { en: "Work", ar: "الأعمال" },
  skills: { en: "Skills", ar: "المهارات" },
  experience: { en: "Experience", ar: "الخبرات" },
  pricing: { en: "Pricing", ar: "الأسعار" },
  testimonials: { en: "Reviews", ar: "الآراء" },
  faq: { en: "FAQ", ar: "أسئلة" },
  blog: { en: "Blog", ar: "المقالات" },
  booking: { en: "Book", ar: "احجز" },
  contact: { en: "Contact", ar: "تواصل" },
};
// the header has room for a handful; the rest stay reachable by scrolling
const NAV_PRIORITY: SectionId[] = ["work", "services", "pricing", "experience", "booking", "contact"];

export function Monogram({ profile, size = 36 }: { profile: Profile; size?: number }) {
  if (profile.logo_url) {
    return <img src={profile.logo_url} alt="" width={size} height={size} className="rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  const initials = profile.full_name_en
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span className="grid place-items-center rounded-xl bg-grad text-white font-display font-bold text-sm shadow-[0_8px_24px_-10px_var(--accent)]" style={{ width: size, height: size }} aria-hidden>
      {initials || "AI"}
    </span>
  );
}

export function AnnouncementBar() {
  const { settings: s } = useSettings();
  const { pick } = usePrefs();
  const text = pick(s.announce_en, s.announce_ar);
  if (!s.announce_enabled || !text) return null;
  const body = (
    <>
      <Megaphone size={14} className="shrink-0" />
      <span className="truncate">{text}</span>
      {s.announce_link && <ArrowUpRight size={14} className="shrink-0 rtl:-scale-x-100" />}
    </>
  );
  const cls = "flex items-center justify-center gap-2 h-9 px-4 bg-grad text-white text-xs sm:text-sm font-medium";
  return s.announce_link ? (
    <a href={s.announce_link} target={s.announce_link.startsWith("#") || s.announce_link.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className={`${cls} hover:underline`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function Header({ profile, sections, base = "", hasBlog = false }: { profile: Profile; sections: SectionId[]; base?: string; hasBlog?: boolean }) {
  const { isAr, pick, lang, setLang, isDark, setIsDark } = usePrefs();
  const { settings: s } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const brand = pick(s.brand_name_en, s.brand_name_ar) || pick(profile.full_name_en, profile.full_name_ar).split(/\s+/).slice(0, 2).join(" ");
  const desktop = NAV_PRIORITY.filter((id) => sections.includes(id)).slice(0, 5);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // highlight the section currently in the middle of the screen
  useEffect(() => {
    if (base) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), {
      rootMargin: "-45% 0px -50% 0px",
    });
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections, base]);

  const controls = (
    <>
      {s.show_lang_toggle && (
        <button type="button" onClick={() => setLang(lang === "EN" ? "AR" : "EN")} className={`${btn.icon} font-mono text-xs`} aria-label={isAr ? "Switch to English" : "التبديل للعربية"}>
          {lang === "EN" ? "ع" : "EN"}
        </button>
      )}
      {s.show_theme_toggle && (
        <button type="button" onClick={() => setIsDark(!isDark)} className={btn.icon} aria-label={isDark ? pick("Light theme", "الوضع الفاتح") : pick("Dark theme", "الوضع الداكن")}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />
      <div className={`px-3 sm:px-6 transition-[padding] duration-500 ${scrolled ? "pt-3" : "pt-5"}`}>
        <div
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-pill ps-3 pe-2 sm:ps-4 transition-all duration-500 ${
            scrolled || open ? "glass shadow-[0_20px_60px_-30px_var(--accent)]" : "border border-transparent"
          }`}
        >
          <Link to={base || "/"} onClick={() => setOpen(false)} className="flex items-center gap-3 min-w-0">
            <Monogram profile={profile} />
            <span className="font-display font-semibold tracking-tight truncate">{brand}</span>
          </Link>

          <nav aria-label={pick("Main", "القائمة الرئيسية")} className="hidden lg:flex items-center gap-0.5">
            {desktop.map((id) => (
              <a
                key={id}
                href={`${base}#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={`relative px-4 py-2 rounded-pill text-sm transition-colors ${active === id ? "text-fg" : "text-muted hover:text-fg"}`}
              >
                {active === id && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-pill bg-surface-2/80 border border-line" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{isAr ? LABELS[id].ar : LABELS[id].en}</span>
              </a>
            ))}
            {hasBlog && (
              <Link to="/blog" className="px-4 py-2 rounded-pill text-sm text-muted hover:text-fg">
                {pick("Blog", "المقالات")}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">{controls}</div>
            {s.show_hire_button && (
              <span className="hidden lg:block">
                <Magnetic strength={0.2}>
                  <a href={`${base}#${sections.includes("booking") ? "booking" : "contact"}`} className={`${btn.primary} !py-2.5`}>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    {pick(s.hire_label_en, s.hire_label_ar)}
                  </a>
                </Magnetic>
              </span>
            )}
            <button type="button" className={`${btn.icon} lg:hidden`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={pick("Menu", "القائمة")}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label={pick("Main", "القائمة الرئيسية")}
            className="lg:hidden fixed inset-x-0 bottom-0 top-[88px] z-40 bg-bg/90 backdrop-blur-2xl px-6 py-6 flex flex-col overflow-y-auto"
          >
            <ol className="flex-1">
              {sections.map((id, i) => (
                <motion.li key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                  <a href={`${base}#${id}`} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3.5 border-b border-line">
                    <span className="font-mono text-xs text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-3xl tracking-tight">{isAr ? LABELS[id].ar : LABELS[id].en}</span>
                  </a>
                </motion.li>
              ))}
              {hasBlog && (
                <li>
                  <Link to="/blog" onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3.5 border-b border-line">
                    <span className="font-mono text-xs text-accent-ink">↗</span>
                    <span className="font-display text-3xl tracking-tight">{pick("All articles", "كل المقالات")}</span>
                  </Link>
                </li>
              )}
            </ol>
            <div className="flex items-center gap-2 pt-6">{controls}</div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
