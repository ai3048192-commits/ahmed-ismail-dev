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

  return (
    <footer className="relative px-3 sm:px-6 pb-6 pt-16 overflow-hidden">
      <div className="glass relative max-w-7xl mx-auto rounded-[2.25rem] overflow-hidden">
        <div aria-hidden className="absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-grad opacity-25 blur-[100px]" />
        <div className="relative p-8 sm:p-14 text-center">
          {cta && <p className="font-display font-semibold text-4xl sm:text-6xl tracking-tight leading-[1.05] text-balance max-w-[18ch] mx-auto">{cta}</p>}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <a href={`${base}#contact`} className={btn.primary}>
                {pick("Start a project", "ابدأ مشروع")} <ArrowUpRight size={16} className="rtl:-scale-x-100" />
              </a>
            </Magnetic>
            {profile.cv_url && (
              <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" onClick={() => track("cv_download", "footer")} className={btn.ghost}>
                <Download size={16} /> {pick("CV", "الـ CV")}
              </a>
            )}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <SocialLinks profile={profile} />
            <a href="#top" className={btn.icon} aria-label={pick("Back to top", "لأعلى الصفحة")}>
              <ArrowUp size={16} />
            </a>
          </div>
        </div>

        <div className="relative px-8 sm:px-14 py-5 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
          <span>
            © {new Date().getFullYear()} {name}
            {pick(s.footer_note_en, s.footer_note_ar) && <span> · {pick(s.footer_note_en, s.footer_note_ar)}</span>}
          </span>
          <span className="flex items-center gap-4">
            {hasBlog && (
              <Link to="/blog" className="hover:text-fg">
                {pick("Blog", "المقالات")}
              </Link>
            )}
            <span>{pick(profile.role_en, profile.role_ar)}</span>
          </span>
        </div>

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
