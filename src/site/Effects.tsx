import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useScroll, useSpring } from "framer-motion";
import type { SiteSettings } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import { useMotionOK } from "./useMotionOK";

const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** 3D tilt that follows the pointer, with a soft glare. Off on touch screens. */
export function Tilt({ children, className = "", max = 7, enabled = true }: { children: ReactNode; className?: string; max?: number; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const motionOK = useMotionOK();
  const [hover] = useState(canHover);

  if (!enabled || !motionOK || !hover) return <div className={className}>{children}</div>;

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--glare", "1");
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    el.style.setProperty("--glare", "0");
  };

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`relative transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d] ${className}`}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{ opacity: "var(--glare, 0)", background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.13), transparent 50%)" }}
      />
    </div>
  );
}

/** pulls its child a little toward the pointer */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionOK = useMotionOK();
  const { settings } = useSettings();
  const [hover] = useState(canHover);
  if (!settings.magnetic_buttons || !motionOK || !hover) return <>{children}</>;
  return (
    <span
      ref={ref}
      className="inline-block transition-transform duration-300 ease-out"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
      }}
      onPointerLeave={() => ref.current && (ref.current.style.transform = "translate(0,0)")}
    >
      {children}
    </span>
  );
}

/** fades content up the first time it scrolls into view */
export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const motionOK = useMotionOK();
  const Tag = as === "li" ? motion.li : motion.div;
  if (!motionOK) return as === "li" ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
  return (
    <Tag
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/** counts up from 0 the first time it renders */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionOK = useMotionOK();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionOK) {
      el.textContent = String(value);
      return;
    }
    const ctl = animate(0, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = String(Math.round(v))) });
    return () => ctl.stop();
  }, [value, motionOK]);
  return <span ref={ref}>{value}</span>;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left rtl:origin-right bg-accent" style={{ scaleX }} />;
}

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      el.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      el.style.opacity = "1";
    };
    const leave = () => (el.style.opacity = "0");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 -z-[5] h-[600px] w-[600px] rounded-full opacity-0 transition-opacity duration-500"
      style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 10%, transparent), transparent 65%)" }}
    />
  );
}

// a tiny SVG noise tile; gives flat surfaces a printed, tactile feel
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E")`;

function Grain() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-[65] opacity-[0.045] mix-blend-overlay dark:opacity-[0.07]" style={{ backgroundImage: NOISE }} />;
}

/** three slow color clouds drifting behind everything */
function Aurora({ animate }: { animate: boolean }) {
  const blob = "absolute rounded-full blur-[110px] will-change-transform";
  const anim = (name: string, secs: number) => (animate ? { animation: `${name} ${secs}s ease-in-out infinite` } : undefined);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={`${blob} -top-[20%] -left-[10%] h-[60vmax] w-[60vmax] opacity-[0.28] dark:opacity-[0.32]`} style={{ background: "var(--accent)", ...anim("aurora-a", 26) }} />
      <div className={`${blob} top-[10%] -right-[15%] h-[55vmax] w-[55vmax] opacity-[0.22] dark:opacity-[0.26]`} style={{ background: "var(--accent-2)", ...anim("aurora-b", 32) }} />
      <div
        className={`${blob} -bottom-[25%] left-[20%] h-[50vmax] w-[50vmax] opacity-[0.16] dark:opacity-[0.2]`}
        style={{ background: "color-mix(in oklab, var(--accent) 50%, #22d3ee)", ...anim("aurora-c", 38) }}
      />
      {/* keeps text readable on top of the color */}
      <div className="absolute inset-0 bg-bg/40" />
    </div>
  );
}

/** a card whose border and surface light up under the pointer */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
      className={`group/spot relative overflow-hidden ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--sx, 50%) var(--sy, 50%), color-mix(in oklab, var(--accent) 16%, transparent), transparent 45%)" }}
      />
      {children}
    </div>
  );
}

function Background({ kind, animate }: { kind: SiteSettings["background"]; animate: boolean }) {
  if (kind === "none") return null;
  if (kind === "aurora") return <Aurora animate={animate} />;
  const fade = "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)";
  const style: React.CSSProperties =
    kind === "grid"
      ? {
          backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: fade,
          WebkitMaskImage: fade,
        }
      : kind === "dots"
        ? { backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)", backgroundSize: "22px 22px", maskImage: fade, WebkitMaskImage: fade }
        : {
            background:
              "radial-gradient(ellipse 55% 40% at 80% -5%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), radial-gradient(ellipse 40% 30% at 0% 30%, color-mix(in oklab, var(--accent) 7%, transparent), transparent 70%)",
          };
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={style} />;
}

export function SiteEffects({ settings }: { settings: SiteSettings }) {
  const motionOK = useMotionOK();
  const [hover] = useState(canHover);
  return (
    <>
      <Background kind={settings.background} animate={motionOK} />
      {settings.grain && <Grain />}
      {settings.scroll_progress && <ScrollProgress />}
      {settings.cursor_glow && hover && motionOK && <CursorGlow />}
    </>
  );
}
