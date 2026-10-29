import { useEffect } from "react";
import { usePrefs } from "../lib/prefs";
import type { SiteSettings } from "../lib/settings";
import type { Profile } from "../lib/types";

function meta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) return el?.remove();
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function link(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) return el?.remove();
  if (!el) {
    el = Object.assign(document.createElement("link"), { rel });
    document.head.appendChild(el);
  }
  el.href = href;
}

const absolute = (url: string) => {
  try {
    return url ? new URL(url, window.location.origin).href : "";
  } catch {
    return "";
  }
};

/** title, description, social cards, structured data and analytics — all from the dashboard */
export type PageMeta = { title?: string; description?: string; image?: string; type?: "website" | "article" };

export default function Seo({ settings: s, profile, preview, page }: { settings: SiteSettings; profile: Profile; preview: boolean; page?: PageMeta }) {
  const { pick, isAr } = usePrefs();

  useEffect(() => {
    const name = pick(profile.full_name_en, profile.full_name_ar);
    const siteTitle = pick(s.seo_title_en, s.seo_title_ar) || `${name} — ${pick(profile.role_en, profile.role_ar)}`;
    const title = page?.title ? `${page.title} — ${name}` : siteTitle;
    const desc = (page?.description || pick(s.seo_desc_en, s.seo_desc_ar) || pick(profile.hero_desc_en, profile.hero_desc_ar)).slice(0, 200);
    const origin = (s.canonical_url || window.location.origin).replace(/\/$/, "");
    const url = origin + window.location.pathname;
    const image = absolute(page?.image || s.og_image || profile.avatar_url || profile.logo_url);

    document.title = title;
    meta("name", "description", desc);
    meta("name", "keywords", s.seo_keywords);
    meta("name", "author", name);
    meta("name", "robots", s.noindex ? "noindex, nofollow" : "index, follow");
    meta("name", "google-site-verification", s.google_verification);
    meta("property", "og:type", page?.type || "website");
    meta("property", "og:title", title);
    meta("property", "og:description", desc);
    meta("property", "og:url", url);
    meta("property", "og:image", image);
    meta("property", "og:locale", isAr ? "ar_EG" : "en_US");
    meta("name", "twitter:card", image ? "summary_large_image" : "summary");
    meta("name", "twitter:title", title);
    meta("name", "twitter:description", desc);
    meta("name", "twitter:image", image);
    link("canonical", s.canonical_url ? url : "");

    // structured data so search engines know this is a person's portfolio
    const ld = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.full_name_en,
      alternateName: profile.full_name_ar,
      jobTitle: profile.role_en,
      email: profile.email ? `mailto:${profile.email}` : undefined,
      url,
      image: image || undefined,
      address: profile.location_en ? { "@type": "PostalAddress", addressCountry: profile.location_en } : undefined,
      sameAs: [profile.github_url, profile.linkedin_url, profile.x_url, profile.facebook_url].filter(Boolean),
    };
    let script = document.head.querySelector<HTMLScriptElement>("script#ld-person");
    if (!script) {
      script = Object.assign(document.createElement("script"), { id: "ld-person", type: "application/ld+json" });
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(ld);
  }, [s, profile, pick, isAr, page?.title, page?.description, page?.image, page?.type]);

  // Google Analytics, loaded once, never inside the dashboard preview
  useEffect(() => {
    const id = s.ga_id.trim();
    if (preview || !/^G-[A-Z0-9]{4,}$/.test(id) || document.getElementById("ga-script")) return;
    document.head.appendChild(Object.assign(document.createElement("script"), { id: "ga-script", async: true, src: `https://www.googletagmanager.com/gtag/js?id=${id}` }));
    const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // gtag expects the arguments object itself
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", id);
  }, [s.ga_id, preview]);

  return null;
}
