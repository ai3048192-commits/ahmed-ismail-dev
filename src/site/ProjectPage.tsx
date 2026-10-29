import { useEffect, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ExternalLink } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/supabase";
import type { Project } from "../lib/types";
import { Reveal } from "./Effects";
import { GithubIcon } from "./icons";
import { Cover } from "./Projects";
import { useSite } from "./SiteData";
import SiteLayout from "./SiteLayout";
import { btn } from "./styles";
import { GradientTitle } from "./ui";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const hostOf = (url?: string | null) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** the screenshot inside a small browser frame (same look as the cards on the home page) */
function BrowserFrame({ p }: { p: Project }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_50px_120px_-60px_var(--accent)]">
      <div className="flex h-10 items-center gap-2 border-b border-line bg-surface-2/60 px-4" dir="ltr" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-faint/40" />
        <span className="mx-auto max-w-[60%] truncate text-xs text-faint">{hostOf(p.url) || p.name_en}</span>
        <span className="w-[50px]" />
      </div>
      <div className="aspect-[16/9] overflow-hidden">
        <Cover p={p} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl tracking-tight">{children}</h2>;
}

/* ------------------------------------------------------------------ */
/* Page blocks                                                         */
/* ------------------------------------------------------------------ */

/** problem → solution → result is a real sequence, so it gets numbers and a connecting line */
function Story({ steps }: { steps: { k: string; v: string }[] }) {
  return (
    <ol>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.k} className="flex gap-5">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border font-display text-sm tabular-nums ${
                  last ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"
                }`}
              >
                {i + 1}
              </span>
              {!last && <span className="mt-2 w-px flex-1 bg-line" aria-hidden />}
            </div>
            <Reveal className={`min-w-0 flex-1 ${last ? "" : "pb-10"}`}>
              <h3 className="pt-1.5 font-display text-xl tracking-tight">{s.k}</h3>
              <p className="mt-3 whitespace-pre-line leading-[1.85] text-muted">{s.v}</p>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}

function Highlights({ items, title }: { items: string[]; title: string }) {
  return (
    <Reveal>
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <SectionTitle>{title}</SectionTitle>
        <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {items.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
              {h}
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  );
}

function Facts({ meta, tags, factsTitle, stackTitle }: { meta: { k: string; v: string }[]; tags: string[]; factsTitle: string; stackTitle: string }) {
  if (!meta.length && !tags.length) return null;
  return (
    <aside className="max-lg:order-first self-start lg:sticky lg:top-28">
      <div className="rounded-3xl border border-line bg-surface p-6">
        {meta.length > 0 && (
          <dl aria-label={factsTitle} className="divide-y divide-line">
            {meta.map((m) => (
              <div key={m.k} className="py-3 first:pt-0 last:pb-0">
                <dt className="text-xs text-faint">{m.k}</dt>
                <dd className="mt-1 font-medium">{m.v}</dd>
              </div>
            ))}
          </dl>
        )}
        {tags.length > 0 && (
          <div className={meta.length ? "mt-5 border-t border-line pt-5" : ""}>
            <p className="mb-3 text-xs text-faint">{stackTitle}</p>
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t} className="rounded-pill border border-line px-3 py-1 text-xs text-muted">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  // with an odd number of images the first one runs full width so the grid has no hole
  const wideFirst = images.length % 2 === 1;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {images.map((src, i) => (
          <Reveal key={src} className={wideFirst && i === 0 ? "sm:col-span-2" : ""}>
            <img src={src} alt="" loading="lazy" className="w-full rounded-2xl border border-line" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PrevNext({ prev, next, label }: { prev: Project; next: Project; label: string }) {
  const { pick, isAr } = usePrefs();
  const Back = isAr ? ArrowRight : ArrowLeft;
  const Fwd = isAr ? ArrowLeft : ArrowRight;
  const items = [
    { p: prev, hint: pick("Previous project", "المشروع السابق"), Icon: Back, end: false },
    { p: next, hint: pick("Next project", "المشروع التالي"), Icon: Fwd, end: true },
  ];

  return (
    <nav aria-label={label} className="mt-24 grid gap-4 sm:grid-cols-2">
      {items.map(({ p: q, hint, Icon, end }) => (
        <Link
          key={q.id}
          to={`/work/${q.slug}`}
          className={`group flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            end ? "sm:flex-row-reverse sm:text-end" : ""
          }`}
        >
          <span className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
            <Cover p={q} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-faint">{hint}</span>
            <span className="mt-1 block truncate font-display text-lg">{pick(q.name_en, q.name_ar)}</span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
            <Icon size={17} aria-hidden />
          </span>
        </Link>
      ))}
    </nav>
  );
}

function NotFound() {
  const { pick } = usePrefs();
  return (
    <SiteLayout meta={{ title: pick("Project not found", "المشروع مش موجود") }}>
      <div className="grid min-h-[70vh] place-items-center px-5 pt-28 text-center">
        <div>
          <h1 className="text-4xl tracking-tight">{pick("This project doesn't exist.", "المشروع ده مش موجود.")}</h1>
          <Link to="/#work" className={`${btn.primary} mt-8`}>
            {pick("All projects", "كل المشاريع")}
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProjectPage() {
  const { slug } = useParams();
  const { pick, isAr } = usePrefs();
  const data = useSite();
  const list = data.projects;
  const i = list.findIndex((p) => p.slug === slug);
  const p = list[i];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (p) track("project_open", p.name_en);
  }, [p]);

  if (data.status === "loading")
    return (
      <SiteLayout>
        <div className="min-h-screen" />
      </SiteLayout>
    );
  if (!p) return <NotFound />;

  const Back = isAr ? ArrowRight : ArrowLeft;
  const tags = isAr && p.tags_ar.length ? p.tags_ar : p.tags_en;
  const highlights = isAr && p.highlights_ar.length ? p.highlights_ar : p.highlights_en;
  const story = [
    { k: pick("The problem", "المشكلة"), v: pick(p.problem_en, p.problem_ar) },
    { k: pick("What I built", "اللي عملته"), v: pick(p.solution_en, p.solution_ar) },
    { k: pick("The result", "النتيجة"), v: pick(p.result_en, p.result_ar) },
  ].filter((s) => s.v);
  const meta = [
    { k: pick("Category", "النوع"), v: p.category },
    { k: pick("Year", "السنة"), v: p.year ? String(p.year) : "" },
    { k: pick("My role", "دوري"), v: pick(p.role_en, p.role_ar) },
  ].filter((m) => m.v);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const hasBody = highlights.length > 0 || story.length > 0;

  return (
    <SiteLayout meta={{ title: pick(p.name_en, p.name_ar), description: pick(p.desc_en, p.desc_ar), image: p.image, type: "article" }}>
      <article className="px-5 pb-16 pt-32 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ---------- header ---------- */}
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 rounded text-sm text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Back size={15} aria-hidden /> {pick("All projects", "كل المشاريع")}
          </Link>

          <Reveal className="mt-10 max-w-4xl">
            <h1 className="text-4xl tracking-tight text-balance sm:text-6xl lg:text-7xl">
              <GradientTitle text={pick(p.name_en, p.name_ar)} />
            </h1>
            <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">{pick(p.desc_en, p.desc_ar)}</p>

            {(p.url || p.repo_url) && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => track("project_link", p.name_en)} className={btn.primary}>
                    {pick("Open live site", "افتح الموقع")} <ExternalLink size={15} aria-hidden />
                  </a>
                )}
                {p.repo_url && (
                  <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                    <GithubIcon size={15} /> {pick("Source code", "الكود")}
                  </a>
                )}
              </div>
            )}
          </Reveal>

          {/* ---------- cover ---------- */}
          <Reveal className="mt-14">
            <BrowserFrame p={p} />
          </Reveal>

          {/* ---------- body ---------- */}
          <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
            <div className="min-w-0 space-y-14">
              {highlights.length > 0 && <Highlights items={highlights} title={pick("Highlights", "أهم النقاط")} />}
              {story.length > 0 && <Story steps={story} />}
              {!hasBody && (
                <p className="leading-relaxed text-muted">{pick("A full case study for this project is coming soon.", "دراسة الحالة الكاملة للمشروع ده قريب.")}</p>
              )}
              {p.gallery.length > 0 && <Gallery images={p.gallery} title={pick("Screens", "لقطات من المشروع")} />}
            </div>

            <Facts meta={meta} tags={tags} factsTitle={pick("Project details", "تفاصيل المشروع")} stackTitle={pick("Built with", "التقنيات المستخدمة")} />
          </div>

          {/* ---------- more projects ---------- */}
          {list.length > 1 && <PrevNext prev={prev} next={next} label={pick("More projects", "مشاريع تانية")} />}
        </div>
      </article>
    </SiteLayout>
  );
}