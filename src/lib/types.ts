// Row shapes of the tables in supabase/schema.sql

export type Profile = {
  id: 1;
  full_name_en: string;
  full_name_ar: string;
  role_en: string;
  role_ar: string;
  hero_title_en: string;
  hero_title_ar: string;
  hero_desc_en: string;
  hero_desc_ar: string;
  about_en: string;
  about_ar: string;
  location_en: string;
  location_ar: string;
  available: boolean;
  years_experience: number;
  email: string;
  whatsapp: string;
  reply_time_en: string;
  reply_time_ar: string;
  github_url: string;
  linkedin_url: string;
  x_url: string;
  facebook_url: string;
  cv_url: string;
  avatar_url: string;
  logo_url: string;
  chat_enabled: boolean;
  chat_context: string;
  updated_at: string;
};

export type Skill = {
  id: number;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  category: string;
  color: string;
  level: number;
  sort_order: number;
  created_at: string;
};

export type Project = {
  id: number;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  category: string;
  tags_en: string[];
  tags_ar: string[];
  role_en: string;
  role_ar: string;
  highlights_en: string[];
  highlights_ar: string[];
  problem_en: string;
  problem_ar: string;
  solution_en: string;
  solution_ar: string;
  result_en: string;
  result_ar: string;
  url: string;
  repo_url: string;
  image: string;
  gallery: string[];
  slug: string;
  year: number | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type ExperienceKind = "work" | "education" | "certificate";

export type Experience = {
  id: number;
  kind: ExperienceKind;
  title_en: string;
  title_ar: string;
  org_en: string;
  org_ar: string;
  period: string;
  desc_en: string;
  desc_ar: string;
  image: string;
  verify_url: string;
  sort_order: number;
  created_at: string;
};

export type Service = {
  id: number;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type Testimonial = {
  id: number;
  name: string;
  role_en: string;
  role_ar: string;
  quote_en: string;
  quote_ar: string;
  avatar: string;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  topic: string;
  message: string;
  is_read: boolean;
  starred: boolean;
  created_at: string;
};

export type Visit = {
  id: number;
  path: string;
  referrer: string;
  lang: string;
  device: string;
  created_at: string;
};

export const SKILL_CATEGORIES = ["Frontend", "Backend", "Design", "Tools", "Performance"] as const;
export const PROJECT_CATEGORIES = ["Applications", "Dashboards", "E-Commerce", "Platforms", "Systems"] as const;
export const MESSAGE_TOPICS = ["project", "frontend", "job", "other"] as const;

export type Post = {
  id: number;
  slug: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  body_en: string;
  body_ar: string;
  cover: string;
  tags: string[];
  published: boolean;
  published_at: string;
  sort_order: number;
  created_at: string;
};

export type Package = {
  id: number;
  name_en: string;
  name_ar: string;
  price: string;
  period_en: string;
  period_ar: string;
  desc_en: string;
  desc_ar: string;
  features_en: string[];
  features_ar: string[];
  cta_en: string;
  cta_ar: string;
  highlighted: boolean;
  sort_order: number;
  created_at: string;
};

export type Faq = {
  id: number;
  q_en: string;
  q_ar: string;
  a_en: string;
  a_ar: string;
  sort_order: number;
  created_at: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: number;
  name: string;
  email: string;
  phone: string;
  topic: string;
  note: string;
  start_at: string;
  duration_min: number;
  status: BookingStatus;
  created_at: string;
};

export type SiteEvent = {
  id: number;
  type: string;
  label: string;
  created_at: string;
};
