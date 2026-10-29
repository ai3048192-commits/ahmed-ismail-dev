import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/supabase";
import { Reveal } from "./Effects";
import { GithubIcon } from "./icons";
import { Cover } from "./Projects";
import { useSite } from "./SiteData";
import SiteLayout from "./SiteLayout";
import { btn } from "./styles";
import { GradientTitle } from "./ui";

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

  if (data.status === "loading") return <SiteLayout><div className="min-h-screen" /></SiteLayout>;

  if (!p) {
    return (
      <SiteLayout meta={{ title: pick("Project not found", "المشروع مش موجود") }}>
        <div className="min-h-[70vh] grid place-items-center px-5 text-center pt-28">
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
    { k: pick("Role", "دوري"), v: pick(p.role_en, p.role_ar) },
  ].filter((m) => m.v);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const Back = isAr ? ArrowRight : ArrowLeft;
  const Fwd = isAr ? ArrowLeft : ArrowRight;

  return (
    <SiteLayout meta={{ title: pick(p.name_en, p.name_ar), description: pick(p.desc_en, p.desc_ar), image: p.image, type: "article" }}>
      <article className="px-5 sm:px-8 pt-32 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/#work" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <Back size={15} /> {pick("All projects", "كل المشاريع")}
          </Link>

          <Reveal className="mt-8 text-center">
            <p className="text-sm text-accent-ink">{p.category}</p>
            <h1 className="mt-4 text-4xl sm:text-6xl lg:text-7xl tracking-tight text-balance">
              <GradientTitle text={pick(p.name_en, p.name_ar)} />
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed max-w-[60ch] mx-auto">{pick(p.desc_en, p.desc_ar)}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => track("project_link", p.name_en)} className={btn.primary}>
                  {pick("Open live site", "افتح الموقع")} <ExternalLink size={15} />
                </a>
              )}
              {p.repo_url && (
                <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                  <GithubIcon size={15} /> {pick("Source code", "الكود")}
                </a>
              )}
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <div className="glass rounded-[2rem] p-3 shadow-[0_50px_120px_-50px_var(--accent)]">
              <div className="aspect-[16/9] overflow-hidden rounded-[1.5rem]">
                <Cover p={p} />
              </div>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-6 lg:sticky lg:top-28 self-start">
              {meta.length > 0 && (
                <dl className="glass rounded-3xl p-6 space-y-4">
                  {meta.map((m) => (
                    <div key={m.k}>
                      <dt className="text-xs text-faint">{m.k}</dt>
                      <dd className="mt-1 font-medium">{m.v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <li key={t} className="glass rounded-pill px-3 py-1 text-xs text-muted">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <div className="space-y-10">
              {highlights.length > 0 && (
                <Reveal>
                  <h2 className="text-2xl tracking-tight">{pick("Highlights", "أهم النقاط")}</h2>
                  <ul className="mt-5 space-y-3">
                    {highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-muted leading-relaxed">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-grad" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
              {story.map((s) => (
                <Reveal key={s.k}>
                  <h2 className="text-2xl tracking-tight text-grad w-fit">{s.k}</h2>
                  <p className="mt-4 text-muted leading-[1.85] whitespace-pre-line">{s.v}</p>
                </Reveal>
              ))}
              {!highlights.length && !story.length && (
                <p className="text-muted leading-relaxed">{pick("A full case study for this project is coming soon.", "دراسة الحالة الكاملة للمشروع ده قريب.")}</p>
              )}
              {p.gallery.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {p.gallery.map((src) => (
                    <Reveal key={src}>
                      <img src={src} alt="" loading="lazy" className="w-full rounded-2xl border border-line" />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>

          {list.length > 1 && (
            <nav aria-label={pick("More projects", "مشاريع تانية")} className="mt-20 grid gap-4 sm:grid-cols-2">
              {[
                { p: prev, label: pick("Previous", "السابق"), Icon: Back },
                { p: next, label: pick("Next", "التالي"), Icon: Fwd },
              ].map(({ p: q, label, Icon }, k) => (
                <Link key={k} to={`/work/${q.slug}`} className={`glass group rounded-3xl p-6 flex items-center gap-4 ${k ? "sm:flex-row-reverse sm:text-end" : ""}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-grad text-white transition-transform group-hover:scale-110">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-faint">{label}</span>
                    <span className="block font-display text-lg truncate">{pick(q.name_en, q.name_ar)}</span>
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </article>
    </SiteLayout>
  );
}
