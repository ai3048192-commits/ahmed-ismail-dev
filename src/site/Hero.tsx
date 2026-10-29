import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Clock, Download, MapPin, Sparkles } from "lucide-react";
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

function Chip({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const motionOK = useMotionOK();
  return (
    <motion.div
      initial={motionOK ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl px-4 py-3 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] ${className}`}
      style={motionOK ? { animation: `float-y ${5 + delay * 4}s ease-in-out ${delay}s infinite` } : undefined}
    >
      {children}
    </motion.div>
  );
}

export default function Hero({ profile, projectCount, skills }: { profile: Profile; projectCount: number; skills: Skill[] }) {
  const { pick } = usePrefs();
  const { settings: s } = useSettings();
  const motionOK = useMotionOK();
  const section = useRef<HTMLElement>(null);
  const { time, awake } = useLocalTime(s.timezone || "Africa/Cairo");
  const rise = (delay: number) =>
    motionOK ? { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const } } : {};

  const color = /^#[0-9a-f]{6}$/i.test(s.hero_3d_color) ? s.hero_3d_color : s.accent;
  const location = pick(profile.location_en, profile.location_ar);

  return (
    <section ref={section} id="top" className={`relative min-h-[100svh] px-5 sm:px-8 pb-16 flex flex-col ${s.announce_enabled ? "pt-36" : "pt-28"}`}>
      {/* the 3D object sits behind the headline */}
      <div className="pointer-events-none absolute inset-x-0 top-16 h-[62vh] sm:h-[70vh]">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] opacity-60 bg-grad" />
        {s.hero_3d !== "none" && (
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
              size={0.82}
            />
          </Suspense>
        )}
      </div>

      <div className="relative max-w-6xl w-full mx-auto flex-1 flex flex-col items-center justify-end text-center pt-[30vh] sm:pt-[34vh]">
        {/* floating cards around the object (wide screens) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {profile.available && (
            <Chip className="absolute top-[6%] start-[2%] flex items-center gap-2.5 text-sm" delay={0.3}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              {pick("Available for new projects", "متاح لمشاريع جديدة")}
            </Chip>
          )}
          {profile.years_experience > 0 && (
            <Chip className="absolute top-[4%] end-[3%] text-start" delay={0.45}>
              <p className="font-display text-3xl text-grad leading-none">
                <CountUp value={profile.years_experience} />+
              </p>
              <p className="mt-1 text-xs text-muted">{pick("years of experience", "سنين خبرة")}</p>
            </Chip>
          )}
          {projectCount > 0 && (
            <Chip className="absolute top-[34%] start-[6%] text-start" delay={0.6}>
              <p className="font-display text-3xl text-grad leading-none">
                <CountUp value={projectCount} />
              </p>
              <p className="mt-1 text-xs text-muted">{pick("projects live", "مشروع شغال")}</p>
            </Chip>
          )}
          <Chip className="absolute top-[30%] end-[5%] text-start" delay={0.75}>
            <p className="flex items-center gap-1.5 text-xs text-faint">
              <Clock size={12} /> {location || pick("Local time", "الوقت عندي")}
            </p>
            <p className="mt-1 font-display text-xl tabular-nums">{time}</p>
            <p className="mt-0.5 text-[11px] text-muted">{awake ? pick("Awake — replies fast", "صاحي — هرد بسرعة") : pick("Asleep — replies soon", "نايم — هرد الصبح")}</p>
          </Chip>
        </div>

        <motion.div {...rise(0.05)} className="glass inline-flex items-center gap-3 rounded-pill ps-1.5 pe-4 py-1.5 text-sm">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" /> : <Monogram profile={profile} size={28} />}
          <span className="font-medium">{pick(profile.full_name_en, profile.full_name_ar)}</span>
          <span className="text-faint">·</span>
          <span className="text-muted">{pick(profile.role_en, profile.role_ar)}</span>
        </motion.div>

        <motion.h1 {...rise(0.12)} className="mt-7 text-[2.8rem] leading-[1] sm:text-7xl lg:text-[5.6rem] tracking-[-0.04em] text-balance max-w-[16ch]">
          <GradientTitle text={pick(profile.hero_title_en, profile.hero_title_ar)} />
        </motion.h1>

        <motion.p {...rise(0.2)} className="mt-7 text-base sm:text-lg text-muted leading-relaxed max-w-[58ch]">
          {pick(profile.hero_desc_en, profile.hero_desc_ar)}
        </motion.p>

        <motion.div {...rise(0.28)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
          <SocialLinks profile={profile} />
        </motion.div>

        {/* compact facts for small screens, where the floating cards are hidden */}
        <motion.div {...rise(0.34)} className="lg:hidden mt-8 grid grid-cols-3 gap-2 w-full max-w-md">
          {[
            { v: `${profile.years_experience}+`, l: pick("years", "سنين"), pin: false },
            { v: String(projectCount), l: pick("projects", "مشروع"), pin: false },
            { v: time, l: location || pick("local time", "الوقت"), pin: !!location },
          ].map((x) => (
            <div key={x.l} className="glass rounded-2xl p-3">
              <p className="font-display text-xl text-grad tabular-nums truncate">{x.v}</p>
              <p className="text-[11px] text-muted truncate flex items-center justify-center gap-1">
                {x.pin && <MapPin size={10} />}
                {x.l}
              </p>
            </div>
          ))}
        </motion.div>

        <a href="#work" aria-label={pick("Scroll down", "انزل لتحت")} className="mt-12 grid h-12 w-8 place-items-start justify-center rounded-pill border border-line pt-2">
          <ArrowDown size={14} className="text-muted motion-safe:animate-bounce" />
        </a>
      </div>

      {s.marquee && skills.length > 0 && (
        <div dir="ltr" className="relative max-w-6xl w-full mx-auto mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
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
