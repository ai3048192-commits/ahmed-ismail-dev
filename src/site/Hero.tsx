import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Download, MapPin, Sparkles } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { track } from "../lib/supabase";
import type { Profile, Skill } from "../lib/types";
import { CountUp, Magnetic } from "./Effects";
import { FacebookIcon, GithubIcon, LinkedinIcon, XIcon } from "./icons";
import { Monogram } from "./Header";
import { btn } from "./styles";
import { GradientTitle } from "./ui";
import { useMotionOK } from "./useMotionOK";

// three.js is a big download, so it loads after the page is already readable
const Hero3D = lazy(() => import("./Hero3D"));

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
    const id = setInterval(() => setNow(new Date()), 15_000);
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

/** one cell of the facts bar: label, value, hint — same three rows in every cell so they line up */
function Fact({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface px-5 py-4 sm:px-6 sm:py-5 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
      <dt className="flex items-center gap-2 text-xs text-faint">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 font-display text-2xl sm:text-3xl tracking-tight tabular-nums leading-none">{value}</dd>
      {hint && <p className="mt-2 text-xs text-muted truncate">{hint}</p>}
    </div>
  );
}

export default function Hero({ profile, projectCount, skills }: { profile: Profile; projectCount: number; skills: Skill[] }) {
  const { pick } = usePrefs();
  const { settings: s } = useSettings();
  const motionOK = useMotionOK();
  const section = useRef<HTMLElement>(null);
  const { time, awake } = useLocalTime(s.timezone || "Africa/Cairo");

  // one entrance sequence: everything rises in order, nothing loops
  const rise = (delay: number) =>
    motionOK ? { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const } } : {};

  const color = /^#[0-9a-f]{6}$/i.test(s.hero_3d_color) ? s.hero_3d_color : s.accent;
  const location = pick(profile.location_en, profile.location_ar);
  const name = pick(profile.full_name_en, profile.full_name_ar);

  return (
    <section ref={section} id="top" className={`relative min-h-[100svh] px-5 sm:px-8 pb-12 flex flex-col ${s.announce_enabled ? "pt-36" : "pt-28"}`}>
      <div className="relative max-w-7xl w-full mx-auto flex-1 flex flex-col">
        {/* text + 3D, side by side on wide screens */}
        <div className="flex-1 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 py-6 lg:py-10">
          {/* ---------- text ---------- */}
          <div className="order-2 lg:order-1 flex flex-col items-start text-start">
            <motion.div {...rise(0.05)} className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-line" />
              ) : (
                <Monogram profile={profile} size={48} />
              )}
              <div className="leading-tight">
                <p className="font-semibold">{name}</p>
                <p className="mt-0.5 text-sm text-muted">{pick(profile.role_en, profile.role_ar)}</p>
              </div>
            </motion.div>

            <motion.h1 {...rise(0.12)} className="mt-8 text-[2.7rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem] tracking-[-0.04em] text-balance max-w-[15ch]">
              <GradientTitle text={pick(profile.hero_title_en, profile.hero_title_ar)} />
            </motion.h1>

            <motion.p {...rise(0.2)} className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-[52ch]">
              {pick(profile.hero_desc_en, profile.hero_desc_ar)}
            </motion.p>

            <motion.div {...rise(0.28)} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a href="#work" className={btn.primary}>
                  <Sparkles size={16} />
                  {pick("Explore my work", "شوف أعمالي")}
                </a>
              </Magnetic>
              {profile.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" onClick={() => track("cv_download", "hero")} className={btn.ghost}>
                  <Download size={16} />
                  {pick("Download CV", "حمّل الـ CV")}
                </a>
              )}
            </motion.div>

            <motion.div {...rise(0.34)} className="mt-8">
              <SocialLinks profile={profile} />
            </motion.div>
          </div>

          {/* ---------- 3D object in a frame ---------- */}
          <motion.div
            {...rise(0.1)}
            className="order-1 lg:order-2 relative h-[38vh] min-h-[260px] sm:h-[46vh] lg:h-[64vh] overflow-hidden rounded-[2rem] border border-line bg-surface/40"
          >
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-grad opacity-50 blur-[80px]" />
            {s.hero_3d !== "none" && (
              <div className="absolute inset-0">
                <Suspense fallback={null}>
                  <Hero3D
                    kind={s.hero_3d}
                    color={color}
                    color2={s.accent_2}
                    wireframe={s.hero_3d_wireframe}
                    speed={Math.min(3, Math.max(0, Number(s.hero_3d_speed) || 1))}
                    interactive={s.hero_3d_interactive && motionOK}
                    particles={s.particles}
                    animate={motionOK}
                    eventSource={section}
                    size={0.9}
                  />
                </Suspense>
              </div>
            )}
          </motion.div>
        </div>

        {/* ---------- facts bar (replaces the floating cards) ---------- */}
        <motion.dl
          {...rise(0.4)}
          className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-flow-col lg:auto-cols-fr"
        >
          {profile.available && (
            <Fact
              label={pick("Status", "الحالة")}
              icon={
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              }
              value={pick("Available", "متاح")}
              hint={pick("for new projects", "لمشاريع جديدة")}
            />
          )}
          {profile.years_experience > 0 && (
            <Fact
              label={pick("Experience", "الخبرة")}
              value={
                <>
                  <CountUp value={profile.years_experience} />+
                </>
              }
              hint={pick("years", "سنين")}
            />
          )}
          {projectCount > 0 && (
            <Fact label={pick("Projects", "المشاريع")} value={<CountUp value={projectCount} />} hint={pick("live", "شغّالة")} />
          )}
          <Fact
            label={pick("Local time", "الوقت عندي")}
            icon={<Clock size={12} aria-hidden />}
            value={time}
            hint={
              <span className="inline-flex items-center gap-1">
                {location && <MapPin size={11} aria-hidden />}
                {location ? `${location} · ` : ""}
                {awake ? pick("replies fast", "برد بسرعة") : pick("replies in the morning", "هرد الصبح")}
              </span>
            }
          />
        </motion.dl>
      </div>

      {s.marquee && skills.length > 0 && (
        <div dir="ltr" className="relative max-w-7xl w-full mx-auto mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <ul
            style={{ "--marquee-gap": "16px" } as React.CSSProperties}
            className={`flex w-max gap-8 hover:[animation-play-state:paused] ${motionOK ? "animate-[marquee_50s_linear_infinite]" : ""}`}
          >
            {[...skills, ...skills].map((sk, i) => (
              <li key={`${sk.id}-${i}`} aria-hidden={i >= skills.length} className="flex items-center gap-2.5 font-display text-lg text-muted whitespace-nowrap">
                <span className="h-2 w-2 rounded-full" style={{ background: sk.color, boxShadow: `0 0 12px ${sk.color}` }} />
                {sk.name_en.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}