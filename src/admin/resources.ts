import { PROJECT_CATEGORIES, SKILL_CATEGORIES } from "../lib/types";
import { SERVICE_ICONS } from "../site/icons";
import type { FieldDef, FormSection } from "./form";

/** EN + AR side by side */
export const pair = (key: string, label: string, type: FieldDef["type"] = "text", extra: Partial<FieldDef> = {}): FieldDef[] => [
  { key: `${key}_en`, label: `${label} (English)`, type, lang: "en", half: true, ...extra },
  { key: `${key}_ar`, label: `${label} (عربي)`, type, lang: "ar", half: true, ...extra },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any> & { id: number; sort_order: number };

export type ResourceConfig = {
  table: string;
  title: string;
  singular: string;
  description: string;
  sections: FormSection[];
  defaults: Record<string, unknown>;
  /** shown in the list */
  primary: (r: Row) => string;
  secondary: (r: Row) => string;
  image?: (r: Row) => string;
  color?: (r: Row) => string;
  /** boolean columns that get a one-click switch in the list */
  flags?: { key: string; on: string; off: string }[];
  /** grouping chips above the list */
  groupBy?: { key: string; options: { value: string; label: string }[] };
};

const SKILL_CAT_AR: Record<string, string> = { Frontend: "واجهات", Backend: "باك إند", Design: "تصميم", Tools: "أدوات", Performance: "أداء" };
const PROJECT_CAT_AR: Record<string, string> = { Applications: "تطبيقات", Dashboards: "لوحات تحكم", "E-Commerce": "متاجر", Platforms: "منصات", Systems: "أنظمة" };
const KIND_AR = { work: "شغل", education: "دراسة", certificate: "شهادة" };

export const projects: ResourceConfig = {
  table: "projects",
  title: "المشاريع",
  singular: "مشروع",
  description: "كل مشروع هنا بيظهر في قسم الأعمال. المميز بيظهر الأول، والمخفي مش بيظهر للزوار.",
  primary: (r) => r.name_ar || r.name_en,
  secondary: (r) => [PROJECT_CAT_AR[r.category] || r.category, r.year].filter(Boolean).join(" · "),
  image: (r) => r.image,
  flags: [
    { key: "published", on: "ظاهر", off: "مخفي" },
    { key: "featured", on: "مميز", off: "عادي" },
  ],
  groupBy: { key: "category", options: PROJECT_CATEGORIES.map((c) => ({ value: c, label: PROJECT_CAT_AR[c] })) },
  defaults: {
    name_en: "", name_ar: "", desc_en: "", desc_ar: "", category: "Applications", tags_en: [], tags_ar: [],
    role_en: "", role_ar: "", highlights_en: [], highlights_ar: [], problem_en: "", problem_ar: "",
    solution_en: "", solution_ar: "", result_en: "", result_ar: "", url: "", repo_url: "", image: "",
    gallery: [], slug: "", year: new Date().getFullYear(), featured: false, published: true,
  },
  sections: [
    {
      title: "الأساسيات",
      fields: [
        ...pair("name", "اسم المشروع", "text", { required: true }),
        ...pair("desc", "الوصف", "textarea"),
        { key: "category", label: "النوع", type: "select", half: true, options: PROJECT_CATEGORIES.map((c) => ({ value: c, label: `${PROJECT_CAT_AR[c]} — ${c}` })) },
        { key: "year", label: "السنة", type: "number", half: true },
        { key: "slug", label: "رابط صفحة المشروع", hint: "/work/... — بيتعمل لوحده من الاسم الإنجليزي لو سبته فاضي", type: "text", lang: "en" },
        { key: "url", label: "رابط الموقع", type: "url", half: true },
        { key: "repo_url", label: "رابط الكود (GitHub)", type: "url", half: true },
        { key: "published", label: "ظاهر في الموقع", type: "toggle", half: true },
        { key: "featured", label: "مشروع مميز", hint: "بيظهر الأول وعليه علامة", type: "toggle", half: true },
      ],
    },
    {
      title: "الصور",
      fields: [
        { key: "image", label: "صورة الغلاف", hint: "يفضل 1600×1000", type: "media", folder: "projects" },
        { key: "gallery", label: "صور إضافية", type: "gallery", folder: "projects" },
      ],
    },
    {
      title: "التقنيات والتفاصيل",
      fields: [
        ...pair("tags", "الوسوم", "tags"),
        ...pair("role", "دوري في المشروع"),
        ...pair("highlights", "أهم النقاط", "tags"),
      ],
    },
    {
      title: "دراسة الحالة (اختياري)",
      fields: [...pair("problem", "المشكلة", "textarea"), ...pair("solution", "الحل", "textarea"), ...pair("result", "النتيجة", "textarea")],
    },
  ],
};

export const skills: ResourceConfig = {
  table: "skills",
  title: "المهارات",
  singular: "مهارة",
  description: "المهارات بتظهر في قسم المهارات وفي الشريط المتحرك تحت أول الصفحة.",
  primary: (r) => r.name_ar || r.name_en,
  secondary: (r) => `${SKILL_CAT_AR[r.category] || r.category} · ${r.level}%`,
  color: (r) => r.color,
  groupBy: { key: "category", options: SKILL_CATEGORIES.map((c) => ({ value: c, label: SKILL_CAT_AR[c] })) },
  defaults: { name_en: "", name_ar: "", desc_en: "", desc_ar: "", category: "Frontend", color: "#65a30d", level: 80 },
  sections: [
    {
      title: "المهارة",
      fields: [
        ...pair("name", "الاسم", "text", { required: true }),
        ...pair("desc", "وصف قصير", "textarea"),
        { key: "category", label: "التصنيف", type: "select", half: true, options: SKILL_CATEGORIES.map((c) => ({ value: c, label: `${SKILL_CAT_AR[c]} — ${c}` })) },
        { key: "color", label: "اللون", type: "color", half: true },
        { key: "level", label: "المستوى", type: "range" },
      ],
    },
  ],
};

export const experience: ResourceConfig = {
  table: "experience",
  title: "الخبرات والشهادات",
  singular: "عنصر",
  description: "الشغل والدراسة والشهادات. لو ضفت صورة للشهادة، الزائر يقدر يفتحها.",
  primary: (r) => r.title_ar || r.title_en,
  secondary: (r) => [KIND_AR[r.kind as keyof typeof KIND_AR], r.org_ar || r.org_en, r.period].filter(Boolean).join(" · "),
  image: (r) => r.image,
  groupBy: { key: "kind", options: Object.entries(KIND_AR).map(([value, label]) => ({ value, label })) },
  defaults: { kind: "work", title_en: "", title_ar: "", org_en: "", org_ar: "", period: "", desc_en: "", desc_ar: "", image: "", verify_url: "" },
  sections: [
    {
      title: "التفاصيل",
      fields: [
        { key: "kind", label: "النوع", type: "select", half: true, options: Object.entries(KIND_AR).map(([value, label]) => ({ value, label })) },
        { key: "period", label: "الفترة", hint: "مثال: 2022 — 2023", type: "text", half: true },
        ...pair("title", "العنوان", "text", { required: true }),
        ...pair("org", "الجهة / الشركة"),
        ...pair("desc", "الوصف", "textarea"),
      ],
    },
    {
      title: "الشهادة",
      fields: [
        { key: "image", label: "صورة الشهادة", type: "media", folder: "certificates" },
        { key: "verify_url", label: "رابط التحقق", type: "url" },
      ],
    },
  ],
};

export const services: ResourceConfig = {
  table: "services",
  title: "الخدمات",
  singular: "خدمة",
  description: "الخدمات اللي بتقدمها، بتظهر في أول قسم بعد الواجهة.",
  primary: (r) => r.title_ar || r.title_en,
  secondary: (r) => r.desc_ar || r.desc_en,
  defaults: { title_en: "", title_ar: "", desc_en: "", desc_ar: "", icon: "code" },
  sections: [
    {
      title: "الخدمة",
      fields: [
        ...pair("title", "العنوان", "text", { required: true }),
        ...pair("desc", "الوصف", "textarea"),
        { key: "icon", label: "الأيقونة", type: "select", options: Object.keys(SERVICE_ICONS).map((k) => ({ value: k, label: k })) },
      ],
    },
  ],
};

export const testimonials: ResourceConfig = {
  table: "testimonials",
  title: "آراء العملاء",
  singular: "رأي",
  description: "القسم ده مش بيظهر في الموقع غير لما يبقى فيه رأي واحد ظاهر على الأقل.",
  primary: (r) => r.name,
  secondary: (r) => r.quote_ar || r.quote_en,
  image: (r) => r.avatar,
  flags: [{ key: "published", on: "ظاهر", off: "مخفي" }],
  defaults: { name: "", role_en: "", role_ar: "", quote_en: "", quote_ar: "", avatar: "", published: true },
  sections: [
    {
      title: "الرأي",
      fields: [
        { key: "name", label: "اسم العميل", type: "text", required: true },
        ...pair("role", "وظيفته / شركته"),
        ...pair("quote", "الرأي", "textarea"),
        { key: "avatar", label: "صورة العميل", type: "media", folder: "testimonials" },
        { key: "published", label: "ظاهر في الموقع", type: "toggle" },
      ],
    },
  ],
};

export const posts: ResourceConfig = {
  table: "posts",
  title: "المقالات",
  singular: "مقال",
  description: "المقالات بتظهر في قسم المقالات وفي صفحة /blog. كل مقال له رابط خاص بيه. المحتوى بيتكتب Markdown.",
  primary: (r) => r.title_ar || r.title_en,
  secondary: (r) => [new Date(r.published_at).toLocaleDateString("ar-EG"), (r.tags || []).join("، ")].filter(Boolean).join(" · "),
  image: (r) => r.cover,
  flags: [{ key: "published", on: "منشور", off: "مسودة" }],
  defaults: { title_en: "", title_ar: "", slug: "", excerpt_en: "", excerpt_ar: "", body_en: "", body_ar: "", cover: "", tags: [], published: false, published_at: new Date().toISOString() },
  sections: [
    {
      title: "المقال",
      fields: [
        ...pair("title", "العنوان", "text", { required: true }),
        { key: "slug", label: "الرابط", hint: "بيتعمل لوحده من العنوان الإنجليزي لو سبته فاضي", type: "text", lang: "en", half: true },
        { key: "published", label: "منشور", type: "toggle", half: true },
        ...pair("excerpt", "ملخص قصير", "textarea"),
        { key: "cover", label: "صورة الغلاف", type: "media", folder: "blog" },
        { key: "tags", label: "الوسوم", type: "tags" },
      ],
    },
    {
      title: "المحتوى (Markdown)",
      fields: [
        { key: "body_en", label: "المحتوى (English)", hint: "## عنوان، **عريض**، [رابط](https://...)، - قائمة", type: "textarea", lang: "en", rows: 16 },
        { key: "body_ar", label: "المحتوى (عربي)", type: "textarea", lang: "ar", rows: 16 },
      ],
    },
  ],
};

export const packages: ResourceConfig = {
  table: "packages",
  title: "الباقات والأسعار",
  singular: "باقة",
  description: "باقات بتظهر في قسم الأسعار. علّم على باقة واحدة «مميزة» عشان تظهر بحدود ملونة.",
  primary: (r) => r.name_ar || r.name_en,
  secondary: (r) => [r.price, r.period_ar || r.period_en].filter(Boolean).join(" "),
  flags: [{ key: "highlighted", on: "مميزة", off: "عادية" }],
  defaults: { name_en: "", name_ar: "", price: "", period_en: "", period_ar: "", desc_en: "", desc_ar: "", features_en: [], features_ar: [], cta_en: "", cta_ar: "", highlighted: false },
  sections: [
    {
      title: "الباقة",
      fields: [
        ...pair("name", "الاسم", "text", { required: true }),
        { key: "price", label: "السعر", hint: "زي ما تحب يظهر: $500 أو 5000 ج.م أو «حسب المشروع»", type: "text", half: true },
        { key: "highlighted", label: "باقة مميزة", type: "toggle", half: true },
        ...pair("period", "تحت السعر", "text", { hint: "مثال: لكل مشروع / شهرياً" }),
        ...pair("desc", "وصف قصير", "textarea"),
        ...pair("features", "المميزات", "tags"),
        ...pair("cta", "نص الزرار"),
      ],
    },
  ],
};

export const faqs: ResourceConfig = {
  table: "faqs",
  title: "الأسئلة الشائعة",
  singular: "سؤال",
  description: "الأسئلة بتظهر في قسم الأسئلة الشائعة، والمساعد الذكي بيستخدمها في ردوده.",
  primary: (r) => r.q_ar || r.q_en,
  secondary: (r) => r.a_ar || r.a_en,
  defaults: { q_en: "", q_ar: "", a_en: "", a_ar: "" },
  sections: [{ title: "السؤال", fields: [...pair("q", "السؤال", "text", { required: true }), ...pair("a", "الإجابة", "textarea")] }],
};
