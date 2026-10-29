import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Check, Clock, Link2, Search } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/supabase";
import { PostCard } from "./BlogPreview";
import { Reveal } from "./Effects";
import { useSite } from "./SiteData";
import SiteLayout from "./SiteLayout";
import { btn } from "./styles";
import { GradientTitle } from "./ui";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const readingMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

/** plain text of whatever React rendered inside a heading */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && "props" in node) return nodeText((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

type Heading = { id: string; text: string; level: 2 | 3 };

/** h2/h3 lines of the markdown body (code fences are skipped) */
function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  let fenced = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[`*_[\]]/g, "").replace(/\(.*?\)/g, "").trim();
    if (text) out.push({ id: slugify(text), text, level: m[1].length as 2 | 3 });
  }
  return out;
}

type Post = ReturnType<typeof useSite>["posts"][number];

/* ------------------------------------------------------------------ */
/* Featured post (first card on the index)                             */
/* ------------------------------------------------------------------ */

function FeaturedPost({ post }: { post: Post }) {
  const { pick, isAr } = usePrefs();
  const Forward = isAr ? ArrowLeft : ArrowRight;
  const body = pick(post.body_en, post.body_ar);
  const excerpt = pick(post.excerpt_en, post.excerpt_ar);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group glass grid items-center gap-6 rounded-[2rem] p-3 sm:p-4 lg:grid-cols-[1.15fr_1fr] lg:gap-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-surface-2">
        {post.cover && (
          <img
            src={post.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
      </div>

      <div className="px-2 pb-3 lg:px-0 lg:pb-0 lg:pe-8">
        <p className="flex flex-wrap items-center gap-3 text-sm text-faint">
          <time dateTime={post.published_at}>
            {new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          <span className="flex items-center gap-1">
            <Clock size={13} aria-hidden /> {readingMinutes(body)} {pick("min read", "دقايق قراءة")}
          </span>
        </p>
        <h2 className="mt-4 text-3xl sm:text-4xl tracking-tight text-balance">{pick(post.title_en, post.title_ar)}</h2>
        {excerpt && <p className="mt-4 text-muted leading-relaxed line-clamp-3">{excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((t) => (
              <li key={t} className="rounded-pill border border-line px-3 py-1 text-xs text-muted">
                #{t}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium">
          {pick("Read the article", "اقرا المقال")}
          <Forward size={16} className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Blog index                                                          */
/* ------------------------------------------------------------------ */

export function BlogIndex() {
  const { pick } = usePrefs();
  const { posts, status } = useSite();
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))], [posts]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return [p.title_en, p.title_ar, p.excerpt_en, p.excerpt_ar].some((s) => s?.toLowerCase().includes(q));
    });
  }, [posts, tag, query]);

  const filtering = !!tag || !!query.trim();
  const featured = !filtering && list.length > 2 ? list[0] : null;
  const rest = featured ? list.slice(1) : list;

  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <SiteLayout meta={{ title: pick("Articles", "المقالات") }}>
      <section className="px-5 sm:px-8 pt-36 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <Reveal className="max-w-3xl">
            <h1 className="text-5xl sm:text-7xl tracking-tight text-balance">
              <GradientTitle text={pick("Notes from the work", "ملاحظات من الشغل")} />
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed max-w-xl">
              {pick("Short, practical write-ups about building for the web.", "مقالات قصيرة وعملية عن بناء الويب.")}
            </p>
          </Reveal>

          {/* toolbar */}
          <div className="mt-12 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap -mx-1 px-1">
              {tags.length > 1 &&
                ["", ...tags].map((t) => (
                  <button key={t || "all"} type="button" onClick={() => setTag(t)} aria-pressed={tag === t} className={`${btn.chip(tag === t)} shrink-0`}>
                    {t || pick("All", "الكل")}
                  </button>
                ))}
            </div>

            <label className="relative block md:w-72">
              <span className="sr-only">{pick("Search articles", "ابحث في المقالات")}</span>
              <Search size={16} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-faint" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={pick("Search articles", "ابحث في المقالات")}
                className="h-11 w-full rounded-pill border border-line bg-transparent ps-10 pe-4 text-sm outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>

          {/* content */}
          {status === "loading" ? (
            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-80 rounded-[2rem] bg-surface-2/60 animate-pulse motion-reduce:animate-none" />
              ))}
            </ul>
          ) : list.length === 0 ? (
            <div className="mt-20 text-center">
              <p className="text-muted">{filtering ? pick("Nothing matches that. Try another word or tag.", "مفيش مقال بالشكل ده. جرّب كلمة أو وسم تاني.") : pick("No articles yet.", "لسه مفيش مقالات.")}</p>
              {filtering && (
                <button
                  type="button"
                  onClick={() => {
                    setTag("");
                    setQuery("");
                  }}
                  className={`${btn.primary} mt-6`}
                >
                  {pick("Clear filters", "مسح الفلاتر")}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-10 space-y-5">
              {featured && (
                <Reveal>
                  <FeaturedPost post={featured} />
                </Reveal>
              )}
              {rest.length > 0 && (
                <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p, i) => (
                    <Reveal as="li" key={p.id} delay={(i % 3) * 0.06}>
                      <PostCard post={p} />
                    </Reveal>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Single post                                                         */
/* ------------------------------------------------------------------ */

function ReadingProgress({ target, rtl }: { target: React.RefObject<HTMLElement | null>; rtl: boolean }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setP(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden>
      <div className="h-full w-full bg-accent" style={{ transform: `scaleX(${p})`, transformOrigin: rtl ? "right" : "left" }} />
    </div>
  );
}

function Toc({ headings, activeId, title }: { headings: Heading[]; activeId: string; title: string }) {
  return (
    <nav aria-label={title} className="sticky top-28 hidden xl:block">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <ul className="space-y-0.5 border-s border-line">
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                className={`-ms-px block border-s py-1.5 text-sm leading-snug transition-colors ${h.level === 3 ? "ps-6" : "ps-4"} ${
                  active ? "border-accent text-fg font-medium" : "border-transparent text-faint hover:text-fg"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const { pick, isAr } = usePrefs();
  const { posts, status } = useSite();
  const post = posts.find((p) => p.slug === slug);
  const Back = isAr ? ArrowRight : ArrowLeft;
  const articleRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) track("post_open", post.title_en);
  }, [post]);

  // an Arabic reader gets the Arabic body when there is one, and vice versa
  const body = post ? pick(post.body_en, post.body_ar) : "";
  const bodyIsAr = post ? (isAr ? !!post.body_ar : !post.body_en) : false;
  const headings = useMemo(() => extractHeadings(body), [body]);

  // highlight the section currently being read
  useEffect(() => {
    if (headings.length < 3) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  if (status === "loading")
    return (
      <SiteLayout>
        <div className="min-h-screen" />
      </SiteLayout>
    );
  if (!post) {
    return (
      <SiteLayout meta={{ title: pick("Article not found", "المقال مش موجود") }}>
        <div className="min-h-[70vh] grid place-items-center px-5 text-center pt-28">
          <div>
            <h1 className="text-4xl tracking-tight">{pick("This article doesn't exist.", "المقال ده مش موجود.")}</h1>
            <Link to="/blog" className={`${btn.primary} mt-8`}>
              {pick("All articles", "كل المقالات")}
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);
  const excerpt = pick(post.excerpt_en, post.excerpt_ar);
  const showToc = headings.length >= 3;

  const heading = (Tag: "h2" | "h3") =>
    function Heading({ children }: { children?: ReactNode }) {
      return (
        <Tag id={slugify(nodeText(children))} className="scroll-mt-28">
          {children}
        </Tag>
      );
    };

  return (
    <SiteLayout meta={{ title: pick(post.title_en, post.title_ar), description: excerpt, image: post.cover, type: "article" }}>
      <ReadingProgress target={articleRef} rtl={isAr} />

      <article ref={articleRef} className="px-5 sm:px-8 pt-32 pb-20">
        {/* header */}
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
            <Back size={15} aria-hidden /> {pick("All articles", "كل المقالات")}
          </Link>

          <header className="mt-10 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl tracking-tight text-balance">
              <GradientTitle text={pick(post.title_en, post.title_ar)} />
            </h1>
            {excerpt && <p className="mt-6 text-xl text-muted leading-relaxed">{excerpt}</p>}
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 text-sm text-faint">
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <span className="flex items-center gap-1.5">
                <Clock size={13} aria-hidden /> {readingMinutes(body)} {pick("min read", "دقايق قراءة")}
              </span>
            </p>
          </header>

          {post.cover && (
            <div className="glass mt-10 rounded-[2rem] p-2">
              <img src={post.cover} alt="" className="w-full rounded-[1.6rem]" />
            </div>
          )}
        </div>

        {/* body (+ table of contents on wide screens) */}
        <div className={`mt-14 mx-auto ${showToc ? "max-w-6xl xl:grid xl:grid-cols-[minmax(0,44rem)_13rem] xl:justify-center xl:gap-16" : "max-w-3xl"}`}>
          <div className="min-w-0">
            <div className="md" dir={bodyIsAr ? "rtl" : "ltr"}>
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: heading("h2"),
                  h3: heading("h3"),
                  a: ({ href, children }) => (
                    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {body}
              </Markdown>
            </div>

            <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              {post.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <li key={t} className="glass rounded-pill px-3 py-1 text-xs text-muted">
                      #{t}
                    </li>
                  ))}
                </ul>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-sm text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
                <span aria-live="polite">{copied ? pick("Link copied", "اتنسخ الرابط") : pick("Copy link", "انسخ الرابط")}</span>
              </button>
            </footer>
          </div>

          {showToc && <Toc headings={headings} activeId={activeId} title={pick("In this article", "في المقال ده")} />}
        </div>

        {/* more posts */}
        {more.length > 0 && (
          <div className="max-w-7xl mx-auto mt-28">
            <h2 className="text-3xl tracking-tight">{pick("Keep reading", "اقرا كمان")}</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </SiteLayout>
  );
}