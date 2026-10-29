import { supabase } from "../lib/supabase";
import type { Experience, Faq, Package, Post, Profile, Project, Service, Skill, Testimonial } from "../lib/types";

// shown until the database answers (or if it hasn't been set up yet)
export const DEFAULT_PROFILE: Profile = {
  id: 1,
  full_name_en: "Ahmed Ismail Shabana",
  full_name_ar: "أحمد إسماعيل شبانة",
  role_en: "Frontend Developer",
  role_ar: "مطور واجهات أمامية",
  hero_title_en: "I build web interfaces that load fast and stay easy to change.",
  hero_title_ar: "بكتب واجهات ويب سريعة، واضحة، وسهلة الصيانة.",
  hero_desc_en:
    "Frontend developer working in React, Next.js and TypeScript, with Supabase on the backend.",
  hero_desc_ar: "مطور Frontend بشتغل بـ React وNext.js وTypeScript، ومعاها Supabase للباك إند.",
  about_en: "",
  about_ar: "",
  location_en: "Egypt",
  location_ar: "مصر",
  available: true,
  years_experience: 3,
  email: "ai3048192@gmail.com",
  whatsapp: "201026377928",
  reply_time_en: "I usually reply within a day.",
  reply_time_ar: "عادةً برد خلال يوم.",
  github_url: "",
  linkedin_url: "",
  x_url: "",
  facebook_url: "",
  cv_url: "/Ahmed_Ismail_CV.pdf",
  avatar_url: "",
  logo_url: "",
  chat_enabled: true,
  chat_context: "",
  updated_at: "",
};

export type SiteData = {
  profile: Profile;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  services: Service[];
  testimonials: Testimonial[];
  posts: Post[];
  packages: Package[];
  faqs: Faq[];
  status: "loading" | "ready" | "error";
};

export const EMPTY_SITE_DATA: SiteData = {
  profile: DEFAULT_PROFILE,
  skills: [],
  projects: [],
  experience: [],
  services: [],
  testimonials: [],
  posts: [],
  packages: [],
  faqs: [],
  status: "loading",
};

const ordered = <T>(table: string) =>
  supabase.from(table).select("*").order("sort_order").order("created_at", { ascending: false }).returns<T[]>();

/** everything public in one round of parallel requests; a missing table just comes back empty */
export async function fetchSiteData(): Promise<SiteData> {
  const [profile, skills, projects, experience, services, testimonials, posts, packages, faqs] = await Promise.all([
    supabase.from("profile").select("*").eq("id", 1).maybeSingle<Profile>(),
    ordered<Skill>("skills"),
    ordered<Project>("projects"),
    ordered<Experience>("experience"),
    ordered<Service>("services"),
    ordered<Testimonial>("testimonials"),
    supabase.from("posts").select("*").eq("published", true).order("published_at", { ascending: false }).returns<Post[]>(),
    ordered<Package>("packages"),
    ordered<Faq>("faqs"),
  ]);
  const failed = [profile, skills, projects, experience, services, testimonials, posts, packages, faqs].filter((r) => r.error);
  failed.forEach((r) => console.warn("Site data:", r.error!.message));
  return {
    profile: { ...DEFAULT_PROFILE, ...(profile.data || {}) },
    skills: skills.data || [],
    projects: (projects.data || []).map((p) => ({ ...p, slug: p.slug || String(p.id) })),
    experience: experience.data || [],
    services: services.data || [],
    testimonials: testimonials.data || [],
    posts: posts.data || [],
    packages: packages.data || [],
    faqs: faqs.data || [],
    status: profile.error ? "error" : "ready",
  };
}

/** one row per browser session, so the dashboard can count visits */
export function logVisit(lang: string) {
  try {
    if (sessionStorage.getItem("visit-logged")) return;
    sessionStorage.setItem("visit-logged", "1");
  } catch {
    /* storage blocked: still log once per page load */
  }
  let referrer = "";
  try {
    referrer = document.referrer ? new URL(document.referrer).hostname : "";
    if (referrer === location.hostname) referrer = "";
  } catch {
    /* ignore malformed referrer */
  }
  const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop";
  supabase
    .from("visits")
    .insert({ path: location.pathname.slice(0, 300), referrer: referrer.slice(0, 500), lang, device })
    .then(({ error }) => error && console.warn("Visit log:", error.message));
}

/** wa.me wants digits only, with the country code */
export const waLink = (num: string, text?: string) =>
  `https://wa.me/${num.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
