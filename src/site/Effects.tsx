import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { SiteSettings } from "../lib/settings";
import { useMotionOK } from "./useMotionOK";

/* One shared IntersectionObserver for every <Reveal>, instead of one per element. */
let observer: IntersectionObserver | null = null;
function observe(el: Element) {
  if (typeof IntersectionObserver === "undefined") {
    el.classList.add("is-in");
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        observer!.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/** fades content up the first time it scrolls into view (CSS transition, see .reveal) */
export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  const motionOK = useMotionOK();
  useEffect(() => {
    if (!motionOK || !ref.current) return;
    return observe(ref.current);
  }, [motionOK]);
  const Tag = as;
  const style: CSSProperties | undefined = motionOK && delay ? { transitionDelay: `${delay}s` } : undefined;
  return (
    <Tag ref={ref as never} className={`${motionOK ? "reveal" : ""} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** counts up from 0 once, with requestAnimationFrame */
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
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1400);
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, motionOK]);
  return <span ref={ref}>{value}</span>;
}

/** CSS scroll-timeline where supported; a passive, rAF-throttled listener otherwise */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (CSS.supports?.("animation-timeline: scroll()")) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} aria-hidden className="scroll-progress fixed inset-x-0 top-0 z-[70] h-[2px] origin-left rtl:origin-right bg-accent" style={{ transform: "scaleX(0)" }} />;
}

/** a static background pattern, faded towards the bottom of the first screen */
function Background({ kind }: { kind: SiteSettings["background"] }) {
  if (kind === "none") return null;
  const fade = "linear-gradient(to bottom, black, transparent 85%)";
  const style: CSSProperties =
    kind === "grid"
      ? {
          backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: fade,
          WebkitMaskImage: fade,
        }
      : kind === "dots"
        ? { backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)", backgroundSize: "22px 22px", maskImage: fade, WebkitMaskImage: fade }
        : { background: "radial-gradient(ellipse 60% 70% at 85% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)" };
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[110vh]" style={style} />;
}

export function SiteEffects({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <Background kind={settings.background} />
      {settings.scroll_progress && <ScrollProgress />}
    </>
  );
}
