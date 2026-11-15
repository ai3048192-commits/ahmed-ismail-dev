import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Post } from "../lib/types";
import { Reveal } from "./Effects";
import { btn } from "./styles";
import { Section, SectionHeading } from "./ui";

export function PostCard({ post }: { post: Post }) {
  const { pick, isAr } = usePrefs();
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-surface-2">
        {post.cover ? (
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-grad opacity-30" />
        )}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-xs text-faint">
          {new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
          {post.tags[0] && <span> · {post.tags[0]}</span>}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-accent">
            {pick(post.title_en, post.title_ar)}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{pick(post.excerpt_en, post.excerpt_ar)}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold">
          {pick("Read", "اقرا")} <ArrowUpRight size={15} className="transition-transform group-hover:rotate-45 rtl:-scale-x-100" aria-hidden />
        </span>
      </div>
    </article>
  );
}

export default function BlogPreview({ posts, index }: { posts: Post[]; index: string }) {
  const { pick } = usePrefs();
  return (
    <Section id="blog">
      <SectionHeading section="blog" index={index} />
      <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 0.06}>
            <PostCard post={p} />
          </Reveal>
        ))}
      </ul>
      {posts.length > 3 && (
        <div className="mt-12">
          <Link to="/blog" className={btn.ghost}>
            {pick(`All ${posts.length} articles`, `كل المقالات (${posts.length})`)}
          </Link>
        </div>
      )}
    </Section>
  );
}
