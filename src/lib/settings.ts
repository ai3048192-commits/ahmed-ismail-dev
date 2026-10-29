// Everything the dashboard's "Appearance" and "SEO" pages control.
// Stored as one JSON row in public.site_settings; any key missing there
// falls back to DEFAULT_SETTINGS, so adding an option needs no migration.

export const SECTION_IDS = ["services", "work", "skills", "experience", "pricing", "testimonials", "faq", "blog", "booking", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const HERO_3D = ["glass", "orb", "knot", "crystal", "rings", "torus", "none"] as const;
export const BACKGROUNDS = ["aurora", "glow", "grid", "dots", "none"] as const;
export const RADII = { none: 0, small: 0.5, medium: 1, large: 1.35, xl: 1.75 } as const;

// weights each family actually ships, so the Google Fonts request never 400s
export const LATIN_FONTS: Record<string, string> = {
  "Bricolage Grotesque": "400;500;600;700",
  "Readex Pro": "300;400;500;600;700",
  Inter: "300;400;500;600;700",
  "Space Grotesk": "300;400;500;600;700",
  Sora: "300;400;500;600;700",
  Manrope: "300;400;500;600;700",
  Outfit: "300;400;500;600;700",
  Poppins: "300;400;500;600;700",
  "DM Sans": "300;400;500;600;700",
  Syne: "400;500;600;700",
};
export const ARABIC_FONTS: Record<string, string> = {
  Alexandria: "300;400;500;600;700",
  "Readex Pro": "300;400;500;600;700",
  Cairo: "300;400;500;600;700",
  "IBM Plex Sans Arabic": "300;400;500;600;700",
  "Noto Kufi Arabic": "300;400;500;600;700",
  Tajawal: "300;400;500;700",
  Almarai: "300;400;700",
  "El Messiri": "400;500;600;700",
  Changa: "300;400;500;600;700",
};

export type SiteSettings = {
  // brand & header
  brand_name_en: string;
  brand_name_ar: string;
  favicon_url: string;
  show_lang_toggle: boolean;
  show_theme_toggle: boolean;
  show_hire_button: boolean;
  hire_label_en: string;
  hire_label_ar: string;
  default_theme: "dark" | "light" | "system";
  default_lang: "EN" | "AR";

  // colors
  accent: string;
  accent_2: string;
  dark_bg: string;
  dark_surface: string;
  dark_fg: string;
  light_bg: string;
  light_surface: string;
  light_fg: string;

  // typography & shape
  font_latin: string;
  font_arabic: string;
  font_heading: string;
  base_font_size: number;
  heading_weight: number;
  radius: keyof typeof RADII;
  pill_buttons: boolean;

  // 3D & effects
  hero_3d: (typeof HERO_3D)[number];
  hero_3d_color: string;
  hero_3d_wireframe: boolean;
  hero_3d_speed: number;
  hero_3d_interactive: boolean;
  particles: boolean;
  tilt_cards: boolean;
  cursor_glow: boolean;
  scroll_progress: boolean;
  animations: boolean;
  marquee: boolean;
  background: (typeof BACKGROUNDS)[number];
  grain: boolean;
  magnetic_buttons: boolean;
  projects_view: "grid" | "list";
  projects_per_page: number;
  timezone: string;

  // booking
  booking_enabled: boolean;
  booking_days: number[];
  booking_start: string;
  booking_end: string;
  booking_slot: number;
  booking_days_ahead: number;
  booking_blocked: string[];

  // publishing
  deploy_hook_url: string;

  // sections
  section_order: SectionId[];
  hidden_sections: SectionId[];

  // announcement bar
  announce_enabled: boolean;
  announce_en: string;
  announce_ar: string;
  announce_link: string;

  // footer
  footer_cta_en: string;
  footer_cta_ar: string;
  footer_note_en: string;
  footer_note_ar: string;

  // SEO
  seo_title_en: string;
  seo_title_ar: string;
  seo_desc_en: string;
  seo_desc_ar: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;
  google_verification: string;
  ga_id: string;
  noindex: boolean;

  // maintenance
  maintenance: boolean;
  maintenance_en: string;
  maintenance_ar: string;

  custom_css: string;
} & Record<`${SectionId}_${"eyebrow" | "title" | "intro"}_${"en" | "ar"}`, string>;

export const DEFAULT_SETTINGS: SiteSettings = {
  brand_name_en: "",
  brand_name_ar: "",
  favicon_url: "",
  show_lang_toggle: true,
  show_theme_toggle: true,
  show_hire_button: true,
  hire_label_en: "Hire me",
  hire_label_ar: "اشتغل معايا",
  default_theme: "dark",
  default_lang: "EN",

  accent: "#8b5cff",
  accent_2: "#ff6ec7",
  dark_bg: "#07060f",
  dark_surface: "#110f1f",
  dark_fg: "#f5f3ff",
  light_bg: "#f6f4ff",
  light_surface: "#ffffff",
  light_fg: "#15121f",

  font_latin: "Inter",
  font_arabic: "Alexandria",
  font_heading: "Bricolage Grotesque",
  base_font_size: 16,
  heading_weight: 600,
  radius: "large",
  pill_buttons: true,

  hero_3d: "glass",
  hero_3d_color: "",
  hero_3d_wireframe: false,
  hero_3d_speed: 1,
  hero_3d_interactive: true,
  particles: true,
  tilt_cards: true,
  cursor_glow: true,
  scroll_progress: true,
  animations: true,
  marquee: true,
  background: "aurora",
  grain: true,
  magnetic_buttons: true,
  projects_view: "grid",
  projects_per_page: 7,
  timezone: "Africa/Cairo",

  booking_enabled: true,
  booking_days: [0, 1, 2, 3, 4],
  booking_start: "10:00",
  booking_end: "18:00",
  booking_slot: 30,
  booking_days_ahead: 21,
  booking_blocked: [],

  deploy_hook_url: "",

  section_order: [...SECTION_IDS],
  hidden_sections: [],

  announce_enabled: false,
  announce_en: "",
  announce_ar: "",
  announce_link: "",

  footer_cta_en: "Let's build something good.",
  footer_cta_ar: "يلا نبني حاجة حلوة.",
  footer_note_en: "",
  footer_note_ar: "",

  seo_title_en: "",
  seo_title_ar: "",
  seo_desc_en: "",
  seo_desc_ar: "",
  seo_keywords: "frontend developer, react developer, next.js, typescript, web developer egypt",
  og_image: "",
  canonical_url: "",
  google_verification: "",
  ga_id: "",
  noindex: false,

  maintenance: false,
  maintenance_en: "The site is getting an update. Back soon.",
  maintenance_ar: "الموقع بيتحدث. راجعين قريب.",

  custom_css: "",

  services_eyebrow_en: "Services",
  services_eyebrow_ar: "الخدمات",
  services_title_en: "What I can build for you",
  services_title_ar: "اللي أقدر أعمله لك",
  services_intro_en: "From a single landing page to a full admin system — designed, built and shipped with code your team can keep working on.",
  services_intro_ar: "من صفحة هبوط واحدة لنظام إدارة كامل — تصميم وتنفيذ وتسليم بكود فريقك يقدر يكمّل عليه.",
  work_eyebrow_en: "Selected work",
  work_eyebrow_ar: "أعمال مختارة",
  work_title_en: "Selected projects, live right now",
  work_title_ar: "مشاريع شغالة دلوقتي",
  work_intro_en: "Open any project for the details, or jump straight to the live site.",
  work_intro_ar: "افتح أي مشروع عشان تشوف التفاصيل، أو ادخل على الموقع مباشرة.",
  skills_eyebrow_en: "Skills",
  skills_eyebrow_ar: "المهارات",
  skills_title_en: "The stack I work in every day",
  skills_title_ar: "الأدوات اللي بشتغل بيها كل يوم",
  skills_intro_en: "Real tools from real projects, grouped by what they're for.",
  skills_intro_ar: "أدوات حقيقية من مشاريع حقيقية، متقسمة حسب استخدامها.",
  experience_eyebrow_en: "Experience",
  experience_eyebrow_ar: "الخبرات",
  experience_title_en: "Where I've worked and learned",
  experience_title_ar: "اشتغلت فين واتعلمت فين",
  experience_intro_en: "Anything marked with an eye has the original certificate attached.",
  experience_intro_ar: "أي عنصر عليه علامة العين تقدر تشوف شهادته الأصلية.",
  testimonials_eyebrow_en: "Testimonials",
  testimonials_eyebrow_ar: "آراء العملاء",
  testimonials_title_en: "What clients say",
  testimonials_title_ar: "العملاء قالوا إيه",
  testimonials_intro_en: "",
  testimonials_intro_ar: "",
  pricing_eyebrow_en: "Pricing",
  pricing_eyebrow_ar: "الأسعار",
  pricing_title_en: "Simple packages, clear prices",
  pricing_title_ar: "باقات واضحة وأسعار صريحة",
  pricing_intro_en: "Every project is different — these are starting points. Ask for a custom quote anytime.",
  pricing_intro_ar: "كل مشروع مختلف — دي نقط بداية. اطلب عرض سعر مخصوص في أي وقت.",
  faq_eyebrow_en: "FAQ",
  faq_eyebrow_ar: "أسئلة شائعة",
  faq_title_en: "Questions people usually ask",
  faq_title_ar: "أسئلة الناس بتسألها كتير",
  faq_intro_en: "",
  faq_intro_ar: "",
  blog_eyebrow_en: "Writing",
  blog_eyebrow_ar: "المقالات",
  blog_title_en: "Notes from the work",
  blog_title_ar: "ملاحظات من الشغل",
  blog_intro_en: "Short, practical write-ups about building for the web.",
  blog_intro_ar: "مقالات قصيرة وعملية عن بناء الويب.",
  booking_eyebrow_en: "Book a call",
  booking_eyebrow_ar: "احجز مكالمة",
  booking_title_en: "Pick a time that works for you",
  booking_title_ar: "اختار الميعاد اللي يناسبك",
  booking_intro_en: "A free 30-minute call to talk through your project. Times are shown in your own timezone.",
  booking_intro_ar: "مكالمة مجانية نتكلم فيها عن مشروعك. المواعيد ظاهرة بتوقيتك إنت.",
  contact_eyebrow_en: "Contact",
  contact_eyebrow_ar: "تواصل",
  contact_title_en: "Have a project in mind? Let's talk.",
  contact_title_ar: "عندك مشروع؟ يلا نتكلم.",
  contact_intro_en: "",
  contact_intro_ar: "",
};

/** stored JSON merged over the defaults; unknown sections are dropped, new ones appended */
export function mergeSettings(data: Partial<SiteSettings> | null | undefined): SiteSettings {
  const s = { ...DEFAULT_SETTINGS, ...(data || {}) } as SiteSettings;
  const order = (s.section_order || []).filter((id): id is SectionId => (SECTION_IDS as readonly string[]).includes(id));
  // sections added in later versions slot in before "contact" instead of after the footer-side end
  const missing = SECTION_IDS.filter((id) => !order.includes(id));
  const at = order.indexOf("contact");
  s.section_order = at === -1 ? [...order, ...missing] : [...order.slice(0, at), ...missing, ...order.slice(at)];
  s.hidden_sections = (s.hidden_sections || []).filter((id) => (SECTION_IDS as readonly string[]).includes(id));
  return s;
}

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v: string, fallback: string) => (HEX.test(v?.trim()) ? v.trim() : fallback);

function luminance(color: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** CSS for both themes, built from the settings (injected in a <style> tag) */
export function themeCss(s: SiteSettings) {
  const D = DEFAULT_SETTINGS;
  const accent = hex(s.accent, D.accent);
  const accent2 = hex(s.accent_2, D.accent_2);
  const lum = luminance(accent);
  const accentFg = lum > 0.4 ? "#111113" : "#ffffff";
  // bright accents get a darker step for text and chart marks so they stay readable
  const inkLight = lum > 0.3 ? `color-mix(in oklab, ${accent} 55%, black)` : accent;
  const inkDark = lum < 0.15 ? `color-mix(in oklab, ${accent} 60%, white)` : accent;
  const chart = lum > 0.45 ? `color-mix(in oklab, ${accent} 72%, black)` : accent;

  const mode = (bg: string, surface: string, fg: string, ink: string) => `
  --bg: ${bg};
  --surface: ${surface};
  --surface-2: color-mix(in oklab, ${surface} 93%, ${fg});
  --line: color-mix(in oklab, ${fg} 10%, transparent);
  --fg: ${fg};
  --muted: color-mix(in oklab, ${fg} 64%, ${bg});
  --faint: color-mix(in oklab, ${fg} 46%, ${bg});
  --accent: ${accent};
  --accent-2: ${accent2};
  --grad: linear-gradient(120deg, ${accent}, ${accent2});
  --accent-fg: ${accentFg};
  --accent-ink: ${ink};
  --chart: ${chart};`;

  const r = RADII[s.radius] ?? 1;
  const radius = Object.entries({ xs: 0.125, sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5 })
    .map(([k, v]) => `--radius-${k}: ${+(v * r).toFixed(3)}rem;`)
    .join(" ");
  const latin = LATIN_FONTS[s.font_latin] ? s.font_latin : D.font_latin;
  const arabic = ARABIC_FONTS[s.font_arabic] ? s.font_arabic : D.font_arabic;
  const heading = LATIN_FONTS[s.font_heading] ? s.font_heading : latin;

  return `:root {${mode(hex(s.light_bg, D.light_bg), hex(s.light_surface, D.light_surface), hex(s.light_fg, D.light_fg), inkLight)}
  ${radius}
  --pill-radius: ${s.pill_buttons ? "9999px" : `${+(0.75 * r).toFixed(3)}rem`};
  --body-font: "${latin}", "${arabic}", ui-sans-serif, system-ui, sans-serif;
  --display-font: "${heading}", "${arabic}", ui-sans-serif, system-ui, sans-serif;
  --heading-weight: ${Math.min(800, Math.max(300, Number(s.heading_weight) || 600))};
  font-size: ${Math.min(20, Math.max(13, Number(s.base_font_size) || 16))}px;
}
.dark {${mode(hex(s.dark_bg, D.dark_bg), hex(s.dark_surface, D.dark_surface), hex(s.dark_fg, D.dark_fg), inkDark)}
}`;
}

export function fontsHref(s: SiteSettings) {
  const families = new Map<string, string>();
  for (const [name, list] of [
    [s.font_latin, LATIN_FONTS],
    [s.font_heading, LATIN_FONTS],
    [s.font_arabic, ARABIC_FONTS],
  ] as const) {
    if (list[name]) families.set(name, list[name]);
  }
  const q = [...families].map(([name, w]) => `family=${name.replace(/ /g, "+")}:wght@${w}`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&family=JetBrains+Mono:wght@400;500&display=swap`;
}
