import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDownRight, Download } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Profile, Skill } from "../lib/types";
import { CountUp } from "./Effects";
import { FacebookIcon, GithubIcon, LinkedinIcon, XIcon } from "./icons";
import { Monogram } from "./Header";
import { btn } from "./styles";
import { GradientTitle } from "./ui";
import { useMotionOK } from "./useMotionOK";

export function SocialLinks({ profile, className = "" }: { profile: Profile; className?: string }) {
  const links = [
    { href: profile.github_url, label: "GitHub", Icon: GithubIcon },
    { href: profile.linkedin_url, label: "LinkedIn", Icon: LinkedinIcon },
    { href: profile.x_url, label: "X", Icon: XIcon },
    { href: profile.facebook_url, label: "Facebook", Icon: FacebookIcon },
  ].filter((l) => l.href);
  if (!links.length) return null;
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={btn.icon}>
            <Icon size={16} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** the time where Ahmed is, so visitors know if he's likely awake */
function useLocalTime(timezone: string) {
  const { isAr } = usePrefs();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  // an invalid timezone from the dashboard falls back to the visitor's own clock
  let tz: string | undefined = timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = undefined;
  }
  const time = now.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  const hour = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: tz }));
  return { time, awake: hour >= 9 && hour < 23 };
}

function Fact({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-surface p-5 sm:p-6">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-3 font-display text-3xl font-bold tracking-tight tabular-nums leading-none sm:text-4xl">{value}</dd>
      {hint && <p className="mt-2 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function Hero({ profile, projectCount, skills }: { profile: Profile; projectCount: number; skills: Skill[] }) {
  const { pick } = usePrefs();
  const { settings: s } = useSettings();
  const motionOK = useMotionOK();
  const { time, awake } = useLocalTime(s.timezone || "Africa/Cairo");

  // one CSS entrance sequence: everything rises in order, nothing loops
  const rise = (delay: number) => (motionOK ? { className: "rise", style: { animationDelay: `${delay}s` } as CSSProperties } : { className: "", style: undefined });

  const location = pick(profile.location_en, profile.location_ar);
  const name = pick(profile.full_name_en, profile.full_name_ar);

  return (
    <section id="top" className={`relative px-5 sm:px-8 pb-10 ${s.announce_enabled ? "pt-36" : "pt-28"} md:pt-36`}>
      <div className="mx-auto max-w-7xl">
        {/* ---------- status line ---------- */}
        <div {...rise(0)} className={`${rise(0).className} flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-5 text-sm`}>
          <div className="flex items-center gap-3">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <Monogram profile={profile} size={40} />}
            <div className="leading-tight">
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-muted">{pick(profile.role_en, profile.role_ar)}</p>
            </div>
          </div>
          {profile.available && (
            <p className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3.5 py-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {pick("Available for new projects", "متاح لمشاريع جديدة")}
            </p>
          )}
        </div>

        {/* ---------- headline ---------- */}
        <h1
          {...rise(0.08)}
          className={`${rise(0.08).className} mt-10 max-w-[17ch] text-[2.6rem] leading-[1] tracking-[-0.045em] text-balance sm:text-6xl md:mt-14 lg:text-[5.6rem]`}
        >
          <GradientTitle text={pick(profile.hero_title_en, profile.hero_title_ar)} />
        </h1>

        {/* ---------- intro + facts ---------- */}
        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end lg:gap-16">
          <div {...rise(0.16)}>
            <p className="max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">{pick(profile.hero_desc_en, profile.hero_desc_ar)}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#work" className={btn.primary}>
                {pick("See my work", "شوف أعمالي")}
                <ArrowDownRight size={16} className="rtl:-scale-x-100" aria-hidden />
              </a>
              {profile.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" onClick={() => track("cv_download", "hero")} className={btn.ghost}>
                  <Download size={16} aria-hidden />
                  {pick("Download CV", "حمّل الـ CV")}
                </a>
              )}
            </div>
            <SocialLinks profile={profile} className="mt-6" />
          </div>

          <dl {...rise(0.24)} className={`${rise(0.24).className} grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1`}>
            {profile.years_experience > 0 && (
              <Fact
                label={pick("Experience", "الخبرة")}
                value={
                  <>
                    <CountUp value={profile.years_experience} />
                    <span className="text-accent-ink">+</span>
                  </>
                }
                hint={pick("years building for the web", "سنين في بناء الويب")}
              />
            )}
            {projectCount > 0 && <Fact label={pick("Projects", "المشاريع")} value={<CountUp value={projectCount} />} hint={pick("shipped and live", "متسلّمة وشغالة")} />}
            <Fact
              label={location ? `${pick("Local time", "الوقت عندي")} · ${location}` : pick("Local time", "الوقت عندي")}
              value={time}
              hint={awake ? pick("replies fast right now", "برد بسرعة دلوقتي") : pick("replies in the morning", "هرد الصبح")}
            />
          </dl>
        </div>
      </div>

      {/* ---------- skills ticker ---------- */}
      {s.marquee && skills.length > 0 && (
        <div dir="ltr" className="relative mx-auto mt-16 max-w-7xl overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <ul
            style={{ "--marquee-gap": "20px" } as CSSProperties}
            className={`flex w-max gap-10 hover:[animation-play-state:paused] ${motionOK ? "animate-[marquee_60s_linear_infinite]" : ""}`}
          >
            {[...skills, ...skills].map((sk, i) => (
              <li key={`${sk.id}-${i}`} aria-hidden={i >= skills.length} className="flex items-center gap-3 whitespace-nowrap font-display text-xl font-semibold tracking-tight text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: sk.color }} />
                {sk.name_en.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
