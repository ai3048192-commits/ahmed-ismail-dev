import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpRight, Download } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { Magnetic } from "./Effects";
import { SocialLinks } from "./Hero";
import { btn } from "./styles";

export default function Footer({ profile, base = "", hasBlog = false }: { profile: Profile; base?: string; hasBlog?: boolean }) {
  const { pick, isAr } = usePrefs();
  const { settings: s } = useSettings();
  const name = pick(profile.full_name_en, profile.full_name_ar);
  // the first name, set huge across the bottom of the page
  const wordmark = (pick(s.brand_name_en, s.brand_name_ar) || name).split(/\s+/)[0];
  const cta = pick(s.footer_cta_en, s.footer_cta_ar);
  const note = pick(s.footer_note_en, s.footer_note_ar);

  const links = [
    { label: pick("My work", "أعمالي"), href: `${base}#work`, internal: false },
    { label: pick("Contact", "تواصل معايا"), href: `${base}#contact`, internal: false },
    ...(hasBlog ? [{ label: pick("Blog", "المقالات"), href: "/blog", internal: true }] : []),
  ];
  const linkCls = "text-sm text-muted hover:text-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded";

  return (
    <footer className="relative px-3 sm:px-6 pb-6 pt-16 overflow-hidden">
      <div className="glass relative max-w-7xl mx-auto rounded-[2rem] border border-line overflow-hidden">
        <div aria-hidden className="absolute -top-40 start-0 h-80 w-[60%] rounded-full bg-grad opacity-20 blur-[100px]" />

        {/* ---------- top: call to action + columns ---------- */}
        <div className="relative grid gap-12 p-8 sm:p-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="text-start">
            {cta && <p className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-balance max-w-[18ch]">{cta}</p>}
            <div className={`${cta ? "mt-9" : ""} flex flex-wrap items-center gap-3`}>
              <Magnetic>
                <a href={`${base}#contact`} className={btn.primary}>
                  {pick("Start a project", "ابدأ مشروع")} <ArrowUpRight size={16} className="rtl:-scale-x-100" />
                </a>
              </Magnetic>
              {profile.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" onClick={() => track("cv_download", "footer")} className={btn.ghost}>
                  <Download size={16} /> {pick("Download CV", "حمّل الـ CV")}
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-start lg:border-s lg:border-line lg:ps-12">
            <nav aria-label={pick("Site links", "روابط الموقع")}>
              <p className="mb-4 text-sm font-medium">{pick("Explore", "الموقع")}</p>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.internal ? (
                      <Link to={l.href} className={linkCls}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={linkCls}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="mb-4 text-sm font-medium">{pick("Follow", "تابعني")}</p>
              <SocialLinks profile={profile} className="flex-wrap" />
            </div>
          </div>
        </div>

        {/* ---------- bottom bar ---------- */}
        <div className="relative px-8 sm:px-12 py-5 border-t border-line flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-faint">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              © {new Date().getFullYear()} {name}
            </span>
            {note && <span className="text-faint/80">{note}</span>}
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{pick(profile.role_en, profile.role_ar)}</span>
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-muted hover:text-fg hover:border-fg/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowUp size={14} aria-hidden /> {pick("Back to top", "لأعلى الصفحة")}
            </a>
          </div>
        </div>

        {/* ---------- wordmark ---------- */}
        <p
          aria-hidden
          dir={isAr ? "rtl" : "ltr"}
          className="relative select-none whitespace-nowrap px-4 pb-1 text-center font-display font-bold leading-[0.78] tracking-[-0.06em] text-[clamp(4.5rem,21vw,19rem)] bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(180deg, color-mix(in oklab, var(--accent) 45%, transparent), color-mix(in oklab, var(--accent-2) 10%, transparent) 90%)" }}
        >
          {wordmark}
        </p>
      </div>
    </footer>
  );
}