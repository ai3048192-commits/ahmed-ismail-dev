import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/supabase";
import { PostCard } from "./BlogPreview";
import { Reveal } from "./Effects";
import { useSite } from "./SiteData";
import SiteLayout from "./SiteLayout";
import { btn } from "./styles";
import { GradientTitle } from "./ui";

const readingMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));

export function BlogIndex() {
  const { pick } = usePrefs();
  const { posts, status } = useSite();
  const [tag, setTag] = useState("");
  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))], [posts]);
  const list = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <SiteLayout meta={{ title: pick("Articles", "المقالات") }}>
      <section className="px-5 sm:px-8 pt-36 pb-16">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-7xl tracking-tight">
              <GradientTitle text={pick("Notes from the work", "ملاحظات من الشغل")} />
            </h1>
            <p className="mt-6 text-lg text-muted">{pick("Short, practical write-ups about building for the web.", "مقالات قصيرة وعملية عن بناء الويب.")}</p>
          </Reveal>
          {tags.length > 1 && (
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {["", ...tags].map((t) => (
                <button key={t || "all"} type="button" onClick={() => setTag(t)} aria-pressed={tag === t} className={btn.chip(tag === t)}>
                  {t || pick("All", "الكل")}
                </button>
              ))}
            </div>
          )}
          {status !== "loading" && list.length === 0 ? (
            <p className="mt-16 text-center text-muted">{pick("No articles yet.", "لسه مفيش مقالات.")}</p>
          ) : (
            <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 3) * 0.06}>
                  <PostCard post={p} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const { pick, isAr } = usePrefs();
  const { posts, status } = useSite();
  const post = posts.find((p) => p.slug === slug);
  const Back = isAr ? ArrowRight : ArrowLeft;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) track("post_open", post.title_en);
  }, [post]);

  if (status === "loading") return <SiteLayout><div className="min-h-screen" /></SiteLayout>;
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

  // an Arabic reader gets the Arabic body when there is one, and vice versa
  const body = pick(post.body_en, post.body_ar);
  const bodyIsAr = isAr ? !!post.body_ar : !post.body_en;
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <SiteLayout meta={{ title: pick(post.title_en, post.title_ar), description: pick(post.excerpt_en, post.excerpt_ar), image: post.cover, type: "article" }}>
      <article className="px-5 sm:px-8 pt-32 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <Back size={15} /> {pick("All articles", "كل المقالات")}
          </Link>
          <header className="mt-8">
            <p className="flex flex-wrap items-center gap-3 text-sm text-faint">
              <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</time>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {readingMinutes(body)} {pick("min read", "دقايق قراءة")}
              </span>
            </p>
            <h1 className="mt-4 text-4xl sm:text-6xl tracking-tight text-balance">
              <GradientTitle text={pick(post.title_en, post.title_ar)} />
            </h1>
            {pick(post.excerpt_en, post.excerpt_ar) && <p className="mt-5 text-lg text-muted leading-relaxed">{pick(post.excerpt_en, post.excerpt_ar)}</p>}
          </header>
          {post.cover && (
            <div className="glass mt-10 rounded-[2rem] p-2">
              <img src={post.cover} alt="" className="w-full rounded-[1.6rem]" />
            </div>
          )}
          <div className="md mt-12" dir={bodyIsAr ? "rtl" : "ltr"}>
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{ a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{children}</a> }}
            >
              {body}
            </Markdown>
          </div>
          {post.tags.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t} className="glass rounded-pill px-3 py-1 text-xs text-muted">
                  #{t}
                </li>
              ))}
            </ul>
          )}
        </div>
        {more.length > 0 && (
          <div className="max-w-7xl mx-auto mt-24">
            <h2 className="text-3xl tracking-tight text-center">{pick("Keep reading", "اقرا كمان")}</h2>
            <ul className="mt-10 flex flex-wrap justify-center gap-5">
              {more.map((p) => (
                <li key={p.id} className="w-full md:w-[calc((100%-2.5rem)/3)]">
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
