import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import type { Post } from "../lib/types";
import { Reveal, Spotlight } from "./Effects";
import { btn } from "./styles";
import { Section, SectionHeading } from "./ui";

export function PostCard({ post }: { post: Post }) {
  const { pick, isAr } = usePrefs();
  return (
    <Spotlight className="glass group h-full rounded-[1.75rem] p-3 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-surface-2">
        {post.cover ? (
          <img src={post.cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-grad opacity-60" />
        )}
      </div>
      <div className="relative flex flex-1 flex-col px-3 pt-5 pb-3">
        <p className="text-xs text-faint">
          {new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
          {post.tags[0] && <span> · {post.tags[0]}</span>}
        </p>
        <h3 className="mt-2 font-display text-xl tracking-tight leading-snug">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {pick(post.title_en, post.title_ar)}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3">{pick(post.excerpt_en, post.excerpt_ar)}</p>
        <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm text-accent-ink">
          {pick("Read", "اقرا")} <ArrowUpRight size={15} className="rtl:-scale-x-100 transition-transform group-hover:rotate-45" />
        </span>
      </div>
    </Spotlight>
  );
}

export default function BlogPreview({ posts, index }: { posts: Post[]; index: string }) {
  const { pick } = usePrefs();
  return (
    <Section id="blog">
      <SectionHeading section="blog" index={index} />
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 0.07}>
            <PostCard post={p} />
          </Reveal>
        ))}
      </ul>
      {posts.length > 3 && (
        <div className="mt-10 text-center">
          <Link to="/blog" className={btn.ghost}>
            {pick(`All ${posts.length} articles`, `كل المقالات (${posts.length})`)}
          </Link>
        </div>
      )}
    </Section>
  );
}
