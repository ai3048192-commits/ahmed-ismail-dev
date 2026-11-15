import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Megaphone, Menu, Moon, Sun, X } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { SectionId } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import type { Profile } from "../lib/types";
import { btn } from "./styles";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

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

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** the section in the middle of the screen (only on the home page, where the sections live) */
function useActiveSection(sections: SectionId[], enabled: boolean) {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!enabled) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), {
      rootMargin: "-45% 0px -50% 0px",
    });
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections, enabled]);
  return active;
}

/** locks page scroll and closes on Escape while the mobile menu is open */
function useMenuBehaviour(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
}

/* ------------------------------------------------------------------ */
/* Exported pieces used elsewhere                                      */
/* ------------------------------------------------------------------ */

export function Monogram({ profile, size = 36 }: { profile: Profile; size?: number }) {
  if (profile.logo_url) {
    return <img src={profile.logo_url} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = profile.full_name_en
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-fg text-bg font-display font-bold" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
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
      <Megaphone size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
      {s.announce_link && <ArrowUpRight size={14} className="shrink-0 rtl:-scale-x-100" aria-hidden />}
    </>
  );
  const cls = "flex h-9 items-center justify-center gap-2 bg-accent px-4 text-xs font-medium text-accent-fg sm:text-sm";
  const internal = s.announce_link?.startsWith("#") || s.announce_link?.startsWith("/");

  return s.announce_link ? (
    <a href={s.announce_link} target={internal ? undefined : "_blank"} rel="noopener noreferrer" className={`${cls} hover:underline`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Header parts                                                        */
/* ------------------------------------------------------------------ */

/** language + theme switches, each only when the dashboard enables it */
function Controls() {
  const { isAr, pick, lang, setLang, isDark, setIsDark } = usePrefs();
  const { settings: s } = useSettings();
  if (!s.show_lang_toggle && !s.show_theme_toggle) return null;
  return (
    <div className="flex items-center gap-1.5">
      {s.show_lang_toggle && (
        <button
          type="button"
          onClick={() => setLang(lang === "EN" ? "AR" : "EN")}
          className={`${btn.icon} !h-9 !w-9 text-xs font-semibold`}
          aria-label={isAr ? "Switch to English" : "التبديل للعربية"}
        >
          {lang === "EN" ? "ع" : "EN"}
        </button>
      )}
      {s.show_theme_toggle && (
        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className={`${btn.icon} !h-9 !w-9`}
          aria-label={isDark ? pick("Light theme", "الوضع الفاتح") : pick("Dark theme", "الوضع الداكن")}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      )}
    </div>
  );
}

function HireButton({ base, sections, className = "" }: { base: string; sections: SectionId[]; className?: string }) {
  const { pick } = usePrefs();
  const { settings: s } = useSettings();
  if (!s.show_hire_button) return null;
  return (
    <a href={`${base}#${sections.includes("booking") ? "booking" : "contact"}`} className={`${btn.primary} ${className}`}>
      {pick(s.hire_label_en, s.hire_label_ar)}
      <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden />
    </a>
  );
}

function DesktopNav({ ids, base, active, hasBlog }: { ids: SectionId[]; base: string; active: string; hasBlog: boolean }) {
  const { isAr, pick } = usePrefs();
  const link = `relative rounded-pill px-3.5 py-1.5 text-sm transition-colors ${focusRing}`;
  return (
    <nav aria-label={pick("Main", "القائمة الرئيسية")} className="hidden items-center gap-0.5 rounded-pill border border-line bg-surface p-1 lg:flex">
      {ids.map((id) => {
        const on = active === id;
        return (
          <a key={id} href={`${base}#${id}`} aria-current={on ? "true" : undefined} className={`${link} ${on ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
            {isAr ? LABELS[id].ar : LABELS[id].en}
          </a>
        );
      })}
      {hasBlog && (
        <Link to="/blog" className={`${link} text-muted hover:text-fg`}>
          {pick("Blog", "المقالات")}
        </Link>
      )}
    </nav>
  );
}

function MobileMenu({ sections, base, hasBlog, hasAnnounce, close }: { sections: SectionId[]; base: string; hasBlog: boolean; hasAnnounce: boolean; close: () => void }) {
  const { isAr, pick } = usePrefs();
  const row = `flex items-center justify-between gap-4 border-b border-line py-4 ${focusRing}`;

  return (
    <nav
      aria-label={pick("Main", "القائمة الرئيسية")}
      className={`fixed inset-0 z-40 flex flex-col overflow-y-auto bg-bg px-6 pb-8 lg:hidden animate-[fade-in_.2s_ease-out] ${hasAnnounce ? "pt-32" : "pt-24"}`}
    >
      <ul className="flex-1">
        {sections.map((id, i) => (
          <li key={id}>
            <a href={`${base}#${id}`} onClick={close} className={row}>
              <span className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-3xl font-semibold tracking-tight">{isAr ? LABELS[id].ar : LABELS[id].en}</span>
              </span>
              <ArrowUpRight size={20} className="text-faint rtl:-scale-x-100" aria-hidden />
            </a>
          </li>
        ))}
        {hasBlog && (
          <li>
            <Link to="/blog" onClick={close} className={row}>
              <span className="font-display text-3xl font-semibold tracking-tight">{pick("All articles", "كل المقالات")}</span>
              <ArrowUpRight size={20} className="text-faint rtl:-scale-x-100" aria-hidden />
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-8 flex items-center gap-3">
        <div className="flex-1" onClick={close}>
          <HireButton base={base} sections={sections} className="w-full justify-center" />
        </div>
        <Controls />
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export default function Header({ profile, sections, base = "", hasBlog = false }: { profile: Profile; sections: SectionId[]; base?: string; hasBlog?: boolean }) {
  const { pick } = usePrefs();
  const { settings: s } = useSettings();
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const active = useActiveSection(sections, !base);
  const close = useCallback(() => setOpen(false), []);
  useMenuBehaviour(open, close);

  const brand = pick(s.brand_name_en, s.brand_name_ar) || pick(profile.full_name_en, profile.full_name_ar).split(/\s+/).slice(0, 2).join(" ");
  const desktop = NAV_PRIORITY.filter((id) => sections.includes(id)).slice(0, 5);
  const hasAnnounce = s.announce_enabled && !!pick(s.announce_en, s.announce_ar);
  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="relative z-50">
        <AnnouncementBar />
      </div>

      <div className={`relative z-50 border-b transition-colors duration-300 ${solid ? "border-line bg-bg/95" : "border-transparent"}`}>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
          {/* brand */}
          <Link to={base || "/"} onClick={close} className={`flex min-w-0 items-center gap-2.5 justify-self-start rounded-lg ${focusRing}`}>
            <Monogram profile={profile} size={32} />
            <span className="truncate font-display font-bold tracking-tight">{brand}</span>
          </Link>

          {/* nav, truly centred on wide screens */}
          <DesktopNav ids={desktop} base={base} active={active} hasBlog={hasBlog} />

          {/* actions */}
          <div className="flex items-center justify-self-end gap-2">
            <div className="hidden sm:block">
              <Controls />
            </div>
            <span className="hidden lg:block">
              <HireButton base={base} sections={sections} className="!py-2 !px-4" />
            </span>
            <button type="button" className={`${btn.icon} lg:hidden`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={pick("Menu", "القائمة")}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {open && <MobileMenu sections={sections} base={base} hasBlog={hasBlog} hasAnnounce={hasAnnounce} close={close} />}
    </header>
  );
}
