import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Monitor, RefreshCw, RotateCcw, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import {
  ARABIC_FONTS,
  DEFAULT_SETTINGS,
  LATIN_FONTS,
  SECTION_IDS,
  mergeSettings,
  type SectionId,
  type SiteSettings,
} from "../lib/settings";
import { PREVIEW_MESSAGE } from "../lib/site-settings";
import { supabase } from "../lib/supabase";
import { FormSections, type FormSection } from "./form";
import { pair } from "./resources";
import { PageHeader } from "./ui";

const SECTION_AR: Record<SectionId, string> = {
  services: "الخدمات",
  work: "الأعمال (المشاريع)",
  skills: "المهارات",
  experience: "الخبرات والشهادات",
  pricing: "الأسعار",
  testimonials: "آراء العملاء",
  faq: "الأسئلة الشائعة",
  blog: "المقالات",
  booking: "حجز المكالمات",
  contact: "التواصل",
};

const WEEKDAYS = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];

const ACCENTS = [
  { name: "بنفسجي", value: "#8b5cff" },
  { name: "ليموني", value: "#c8f169" },
  { name: "أزرق", value: "#3b82f6" },
  { name: "سماوي", value: "#22d3ee" },
  { name: "زمردي", value: "#10b981" },
  { name: "برتقالي", value: "#f97316" },
  { name: "كهرماني", value: "#f59e0b" },
  { name: "وردي", value: "#ec4899" },
  { name: "أحمر", value: "#ef4444" },
];

// whole-site palettes: one click sets both gradient colors and the backgrounds
const PALETTES: { name: string; values: Partial<SiteSettings> }[] = [
  { name: "الشفق (الافتراضي)", values: { accent: "#8b5cff", accent_2: "#ff6ec7", dark_bg: "#07060f", dark_surface: "#110f1f", light_bg: "#f6f4ff", light_surface: "#ffffff" } },
  { name: "المحيط", values: { accent: "#22d3ee", accent_2: "#6366f1", dark_bg: "#04101a", dark_surface: "#0b1b2b", light_bg: "#effaff", light_surface: "#ffffff" } },
  { name: "الغروب", values: { accent: "#f97316", accent_2: "#ec4899", dark_bg: "#140807", dark_surface: "#22120f", light_bg: "#fff6f1", light_surface: "#ffffff" } },
  { name: "النعناع", values: { accent: "#10b981", accent_2: "#22d3ee", dark_bg: "#04110d", dark_surface: "#0b1d18", light_bg: "#effcf7", light_surface: "#ffffff" } },
  { name: "الدهب", values: { accent: "#f59e0b", accent_2: "#ef4444", dark_bg: "#120c04", dark_surface: "#1f170b", light_bg: "#fffaf0", light_surface: "#ffffff" } },
  { name: "ليموني", values: { accent: "#c8f169", accent_2: "#22d3ee", dark_bg: "#0b0b0c", dark_surface: "#141416", light_bg: "#f6f5f1", light_surface: "#ffffff" } },
];

type Tab = { id: string; label: string; sections?: FormSection[]; custom?: "colors" | "fonts" | "sections" | "seo-preview" | "booking" };

const yes = (label: string, key: keyof SiteSettings, hint?: string, half = true) => ({ key, label, hint, type: "toggle" as const, half });

const DESIGN_TABS: Tab[] = [
  {
    id: "brand",
    label: "الهوية والهيدر",
    sections: [
      {
        title: "الاسم والأيقونة",
        fields: [
          ...pair("brand_name", "الاسم في الهيدر", "text", { hint: "لو فاضي بيظهر اسمك من البيانات الشخصية" }),
          { key: "favicon_url", label: "أيقونة الموقع (Favicon)", hint: "صورة مربعة PNG أو SVG، يفضل 512×512", type: "media", folder: "brand" },
        ],
      },
      {
        title: "الهيدر",
        fields: [
          yes("زرار تغيير اللغة", "show_lang_toggle"),
          yes("زرار الوضع الفاتح/الداكن", "show_theme_toggle"),
          yes("زرار «اشتغل معايا»", "show_hire_button"),
          ...pair("hire_label", "نص الزرار"),
        ],
      },
      {
        title: "الافتراضي للزوار الجداد",
        fields: [
          { key: "default_theme", label: "الوضع", type: "select", half: true, options: [{ value: "dark", label: "داكن" }, { value: "light", label: "فاتح" }, { value: "system", label: "حسب جهاز الزائر" }] },
          { key: "default_lang", label: "اللغة", type: "select", half: true, options: [{ value: "EN", label: "English" }, { value: "AR", label: "العربي" }] },
          {
            key: "timezone",
            label: "المنطقة الزمنية (لساعة أول الصفحة)",
            type: "select",
            options: [
              { value: "Africa/Cairo", label: "القاهرة" },
              { value: "Asia/Riyadh", label: "الرياض" },
              { value: "Asia/Dubai", label: "دبي" },
              { value: "Asia/Kuwait", label: "الكويت" },
              { value: "Africa/Casablanca", label: "الدار البيضاء" },
              { value: "Europe/London", label: "لندن" },
              { value: "Europe/Berlin", label: "برلين" },
              { value: "America/New_York", label: "نيويورك" },
            ],
          },
        ],
      },
    ],
  },
  { id: "colors", label: "الألوان", custom: "colors" },
  { id: "fonts", label: "الخطوط والأشكال", custom: "fonts" },
  {
    id: "3d",
    label: "الـ 3D والتأثيرات",
    sections: [
      {
        title: "المجسم الـ 3D في أول الصفحة",
        fields: [
          {
            key: "hero_3d",
            label: "الشكل",
            type: "select",
            half: true,
            options: [
              { value: "glass", label: "زجاج شفاف (بيكسر الضوء)" },
              { value: "orb", label: "كرة متموجة" },
              { value: "knot", label: "عقدة" },
              { value: "torus", label: "حلقة دونات" },
              { value: "crystal", label: "كريستالة" },
              { value: "rings", label: "حلقات مدارية" },
              { value: "none", label: "من غير 3D" },
            ],
          },
          { key: "hero_3d_color", label: "لون المجسم", hint: "لو فاضي بياخد اللون الأساسي", type: "color", half: true },
          {
            key: "hero_3d_speed",
            label: "السرعة",
            type: "select",
            numeric: true,
            half: true,
            options: [{ value: "0.4", label: "بطيء" }, { value: "1", label: "عادي" }, { value: "1.8", label: "سريع" }],
          },
          yes("شكل سلكي (Wireframe)", "hero_3d_wireframe"),
          yes("يتحرك مع الماوس", "hero_3d_interactive"),
          yes("نجوم/جزيئات حوالين المجسم", "particles"),
        ],
      },
      {
        title: "التأثيرات",
        fields: [
          yes("الكروت بتميل 3D مع الماوس", "tilt_cards"),
          yes("إضاءة بتتبع الماوس", "cursor_glow"),
          yes("شريط التقدم أثناء النزول", "scroll_progress"),
          yes("الحركات والأنيميشن", "animations", "لو قفلتها الموقع كله بيبقى ثابت"),
          yes("شريط المهارات المتحرك", "marquee"),
          yes("ملمس حبيبي خفيف (Grain)", "grain", "بيدي الخلفية إحساس مطبوع"),
          yes("الزراير بتنجذب للماوس", "magnetic_buttons"),
          {
            key: "background",
            label: "خلفية الصفحة",
            type: "select",
            half: true,
            options: [{ value: "aurora", label: "شفق متحرك" }, { value: "glow", label: "توهج" }, { value: "grid", label: "شبكة" }, { value: "dots", label: "نقط" }, { value: "none", label: "سادة" }],
          },
        ],
      },
    ],
  },
  { id: "sections", label: "الأقسام", custom: "sections" },
  { id: "booking", label: "الحجز", custom: "booking" },
  {
    id: "texts",
    label: "نصوص الأقسام",
    sections: SECTION_IDS.map((id) => ({
      title: SECTION_AR[id],
      fields: [...pair(`${id}_eyebrow`, "العنوان الصغير"), ...pair(`${id}_title`, "العنوان الكبير"), ...pair(`${id}_intro`, "الوصف", "textarea")],
    })),
  },
  {
    id: "extras",
    label: "الإعلان والفوتر والصيانة",
    sections: [
      {
        title: "شريط الإعلان (فوق الهيدر)",
        fields: [yes("إظهار الشريط", "announce_enabled", undefined, false), ...pair("announce", "نص الإعلان"), { key: "announce_link", label: "رابط (اختياري)", hint: "رابط خارجي أو #contact", type: "url" }],
      },
      {
        title: "الفوتر",
        fields: [...pair("footer_cta", "الجملة الكبيرة"), ...pair("footer_note", "سطر جنب حقوق النشر")],
      },
      {
        title: "وضع الصيانة",
        fields: [
          yes("قفل الموقع للصيانة", "maintenance", "الزوار بيشوفوا رسالة بس، وإنت (وإنت داخل كأدمن) بتشوف الموقع عادي", false),
          ...pair("maintenance", "رسالة الصيانة"),
        ],
      },
      {
        title: "CSS مخصص (للمتقدمين)",
        fields: [{ key: "custom_css", label: "كود CSS", hint: "بيتضاف للموقع كله. مثال: h1 { letter-spacing: -0.04em }", type: "textarea", lang: "en" }],
      },
    ],
  },
];

const SEO_TABS: Tab[] = [
  {
    id: "search",
    label: "محركات البحث",
    custom: "seo-preview",
    sections: [
      {
        title: "اللي بيظهر في جوجل",
        fields: [
          ...pair("seo_title", "عنوان الصفحة", "text", { hint: "أقل من 60 حرف. لو فاضي: اسمك — وظيفتك" }),
          ...pair("seo_desc", "الوصف", "textarea", { hint: "بين 120 و160 حرف. لو فاضي: وصف أول الصفحة" }),
          { key: "seo_keywords", label: "الكلمات المفتاحية", hint: "مفصولة بفاصلة", type: "text", lang: "en" },
          { key: "canonical_url", label: "رابط الموقع الأساسي", hint: "مثال: https://ahmed.dev — بيمنع تكرار الصفحة في البحث", type: "url" },
          yes("إخفاء الموقع من محركات البحث (noindex)", "noindex", undefined, false),
        ],
      },
    ],
  },
  {
    id: "social",
    label: "المشاركة والتحليلات",
    sections: [
      {
        title: "صورة المشاركة (فيسبوك، واتساب، لينكدإن)",
        fields: [{ key: "og_image", label: "الصورة", hint: "1200×630. لو فاضية بتتاخد صورتك الشخصية", type: "media", folder: "seo" }],
      },
      {
        title: "أدوات جوجل",
        fields: [
          { key: "google_verification", label: "كود Google Search Console", hint: "الجزء اللي جوه content=\"...\" بس", type: "text", lang: "en", half: true },
          { key: "ga_id", label: "Google Analytics ID", hint: "بيبدأ بـ G-", type: "text", lang: "en", half: true },
        ],
      },
      {
        title: "تحديث صور المشاركة",
        fields: [
          {
            key: "deploy_hook_url",
            label: "Deploy Hook (Vercel)",
            hint: "Vercel ← Settings ← Git ← Deploy Hooks. بعد ما تحطه، زرار «انشر الموقع من جديد» في الإعدادات بيحدّث صور وعناوين المشاركة لكل المشاريع والمقالات.",
            type: "url",
          },
        ],
      },
    ],
  },
];

function BookingEditor({ values, set }: { values: SiteSettings; set: (k: keyof SiteSettings, v: unknown) => void }) {
  const [date, setDate] = useState("");
  const days = values.booking_days || [];
  const blocked = values.booking_blocked || [];
  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-chart";
  return (
    <div className="space-y-8">
      <FormSections sections={[{ title: "", fields: [{ key: "booking_enabled", label: "تفعيل حجز المكالمات في الموقع", type: "toggle" }] }]} values={values} onChange={(k, v) => set(k as keyof SiteSettings, v)} />
      <div>
        <p className="text-sm font-medium mb-3">الأيام اللي بتشتغل فيها</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((name, d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => set("booking_days", on ? days.filter((x) => x !== d) : [...days, d].sort())}
                className={`rounded-xl px-4 py-2 text-sm border ${on ? "bg-accent text-accent-fg border-accent" : "border-line text-muted hover:text-fg"}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">من الساعة</span>
          <input type="time" dir="ltr" value={values.booking_start} onChange={(e) => set("booking_start", e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">لحد الساعة</span>
          <input type="time" dir="ltr" value={values.booking_end} onChange={(e) => set("booking_end", e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">مدة المكالمة</span>
          <select value={values.booking_slot} onChange={(e) => set("booking_slot", Number(e.target.value))} className={field}>
            {[15, 20, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} دقيقة
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">الحجز متاح لمدة كام يوم قدام</span>
          <input type="number" dir="ltr" min={1} max={90} value={values.booking_days_ahead} onChange={(e) => set("booking_days_ahead", Number(e.target.value))} className={field} />
        </label>
      </div>
      <p className="text-xs text-faint">
        المواعيد بتوقيت «المنطقة الزمنية» اللي في تاب الهوية ({values.timezone}). الزائر بيشوفها بتوقيته هو، وأقرب حجز بيكون بعد ساعتين على الأقل.
      </p>
      <div>
        <p className="text-sm font-medium mb-3">أيام إجازة (مش متاحة للحجز)</p>
        <div className="flex gap-2">
          <input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} max-w-[14rem]`} />
          <button
            type="button"
            disabled={!date || blocked.includes(date)}
            onClick={() => {
              set("booking_blocked", [...blocked, date].sort());
              setDate("");
            }}
            className="rounded-xl border border-line px-4 text-sm hover:bg-surface-2 disabled:opacity-40"
          >
            إضافة
          </button>
        </div>
        {blocked.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {blocked.map((d) => (
              <li key={d} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 ps-3 pe-1 py-1 text-xs" dir="ltr">
                {d}
                <button type="button" onClick={() => set("booking_blocked", blocked.filter((x) => x !== d))} aria-label={`حذف ${d}`} className="rounded px-1.5 hover:bg-line">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SectionsEditor({ values, set }: { values: SiteSettings; set: (k: keyof SiteSettings, v: unknown) => void }) {
  const order = values.section_order;
  const move = (i: number, d: -1 | 1) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set("section_order", next);
  };
  const toggle = (id: SectionId) =>
    set("hidden_sections", values.hidden_sections.includes(id) ? values.hidden_sections.filter((x) => x !== id) : [...values.hidden_sections, id]);
  return (
    <div>
      <p className="text-sm text-muted mb-4">رتّب الأقسام زي ما تحب، واخفي اللي مش عايزه. القسم اللي مفيهوش بيانات بيستخبى لوحده.</p>
      <ol className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {order.map((id, i) => {
          const hidden = values.hidden_sections.includes(id);
          return (
            <li key={id} className={`flex items-center gap-3 px-4 py-3 bg-bg ${hidden ? "opacity-50" : ""}`}>
              <span className="font-mono text-xs text-faint w-6">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-medium">{SECTION_AR[id]}</span>
              <button type="button" onClick={() => toggle(id)} className="p-2 rounded-lg hover:bg-surface-2 text-muted" aria-label={hidden ? "إظهار" : "إخفاء"}>
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-2 rounded-lg hover:bg-surface-2 text-muted disabled:opacity-25" aria-label="لفوق">
                <ArrowUp size={16} />
              </button>
              <button type="button" disabled={i === order.length - 1} onClick={() => move(i, 1)} className="p-2 rounded-lg hover:bg-surface-2 text-muted disabled:opacity-25" aria-label="لتحت">
                <ArrowDown size={16} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ColorsEditor({ values, set, setMany }: { values: SiteSettings; set: (k: keyof SiteSettings, v: unknown) => void; setMany: (v: Partial<SiteSettings>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-faint uppercase mb-4">ثيمات جاهزة</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PALETTES.map((p) => (
            <button key={p.name} type="button" onClick={() => setMany(p.values)} className="rounded-xl border border-line p-3 text-start hover:border-faint">
              <span className="flex gap-1 mb-2" aria-hidden>
                {[p.values.dark_bg, p.values.dark_surface, p.values.accent, p.values.light_bg].map((c, i) => (
                  <span key={i} className="h-6 flex-1 rounded-md border border-line" style={{ background: c }} />
                ))}
              </span>
              <span className="text-sm">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-faint uppercase mb-4">اللون الأساسي</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => set("accent", a.value)}
              title={a.name}
              aria-label={a.name}
              aria-pressed={values.accent.toLowerCase() === a.value}
              className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${values.accent.toLowerCase() === a.value ? "border-fg" : "border-transparent"}`}
              style={{ background: a.value }}
            />
          ))}
        </div>
        <FormSections
          sections={[
            {
              title: "",
              fields: [
                { key: "accent", label: "اللون الأول", hint: "لون النص فوقه بيتظبط تلقائي عشان يبقى مقروء", type: "color", half: true },
                { key: "accent_2", label: "اللون التاني (للتدرج)", type: "color", half: true },
              ],
            },
          ]}
          values={values}
          onChange={(k, v) => set(k as keyof SiteSettings, v)}
        />
      </div>
      <FormSections
        sections={[
          {
            title: "الوضع الداكن",
            fields: [
              { key: "dark_bg", label: "الخلفية", type: "color", half: true },
              { key: "dark_surface", label: "الكروت", type: "color", half: true },
              { key: "dark_fg", label: "النص", type: "color", half: true },
            ],
          },
          {
            title: "الوضع الفاتح",
            fields: [
              { key: "light_bg", label: "الخلفية", type: "color", half: true },
              { key: "light_surface", label: "الكروت", type: "color", half: true },
              { key: "light_fg", label: "النص", type: "color", half: true },
            ],
          },
        ]}
        values={values}
        onChange={(k, v) => set(k as keyof SiteSettings, v)}
      />
    </div>
  );
}

function FontGrid({ label, fonts, value, onPick, sample }: { label: string; fonts: string[]; value: string; onPick: (f: string) => void; sample: string }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fonts.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onPick(f)}
            aria-pressed={value === f}
            className={`rounded-xl border p-3 text-start transition-colors ${value === f ? "border-chart bg-chart/10" : "border-line hover:border-faint"}`}
          >
            <span className="block text-xl leading-tight truncate" style={{ fontFamily: `"${f}"` }}>
              {sample}
            </span>
            <span className="block text-[11px] text-faint mt-1" dir="ltr">
              {f}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FontsEditor({ values, set }: { values: SiteSettings; set: (k: keyof SiteSettings, v: unknown) => void }) {
  // load every candidate font once, only on this page, so the buttons can show them
  useEffect(() => {
    if (document.getElementById("all-fonts-preview")) return;
    const fams = [...new Set([...Object.keys(LATIN_FONTS), ...Object.keys(ARABIC_FONTS)])].map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`);
    const href = `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`;
    document.head.appendChild(Object.assign(document.createElement("link"), { id: "all-fonts-preview", rel: "stylesheet", href }));
  }, []);

  return (
    <div className="space-y-8">
      <FontGrid label="خط النصوص الإنجليزي" fonts={Object.keys(LATIN_FONTS)} value={values.font_latin} onPick={(f) => set("font_latin", f)} sample="Hello World" />
      <FontGrid label="خط العناوين" fonts={Object.keys(LATIN_FONTS)} value={values.font_heading} onPick={(f) => set("font_heading", f)} sample="Big Title" />
      <FontGrid label="الخط العربي" fonts={Object.keys(ARABIC_FONTS)} value={values.font_arabic} onPick={(f) => set("font_arabic", f)} sample="أهلاً بيك" />
      <FormSections
        sections={[
          {
            title: "الأحجام والأشكال",
            fields: [
              {
                key: "base_font_size",
                label: "حجم الخط",
                type: "select",
                numeric: true,
                half: true,
                options: [14, 15, 16, 17, 18].map((n) => ({ value: String(n), label: `${n}px${n === 16 ? " (عادي)" : ""}` })),
              },
              {
                key: "heading_weight",
                label: "تقل العناوين",
                type: "select",
                numeric: true,
                half: true,
                options: [{ value: "400", label: "عادي" }, { value: "500", label: "متوسط" }, { value: "600", label: "سميك" }, { value: "700", label: "سميك جداً" }],
              },
              {
                key: "radius",
                label: "استدارة الزوايا",
                type: "select",
                half: true,
                options: [{ value: "none", label: "حادة" }, { value: "small", label: "خفيفة" }, { value: "medium", label: "متوسطة" }, { value: "large", label: "كبيرة" }, { value: "xl", label: "كبيرة جداً" }],
              },
              { key: "pill_buttons", label: "الزراير دايرية بالكامل", type: "toggle", half: true },
            ],
          },
        ]}
        values={values}
        onChange={(k, v) => set(k as keyof SiteSettings, v)}
      />
    </div>
  );
}

function SearchPreview({ values }: { values: SiteSettings }) {
  const host = (() => {
    try {
      return new URL(values.canonical_url || window.location.origin).host;
    } catch {
      return window.location.host;
    }
  })();
  const title = values.seo_title_en || "Ahmed Ismail Shabana — Frontend Developer";
  const desc = values.seo_desc_en || "Description from the top of your homepage…";
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-faint uppercase mb-3">شكلك في نتايج جوجل (الإنجليزي)</p>
      <div dir="ltr" className="rounded-2xl border border-line bg-white p-5 text-left font-[arial,sans-serif]">
        <p className="text-[13px] text-[#202124]">{host}</p>
        <p className="text-[19px] leading-snug text-[#1a0dab] mt-1 truncate">{title}</p>
        <p className="text-[13px] leading-relaxed text-[#4d5156] mt-1 line-clamp-2">{desc}</p>
      </div>
      <p className={`mt-2 text-xs ${title.length > 60 ? "text-danger" : "text-faint"}`}>العنوان: {title.length} حرف (الأفضل أقل من 60)</p>
      <p className={`text-xs ${desc.length > 160 ? "text-danger" : "text-faint"}`}>الوصف: {desc.length} حرف (الأفضل 120–160)</p>
    </div>
  );
}

/** the real site in an iframe, scaled to fit, receiving unsaved settings as you type */
function LivePreview({ values }: { values: SiteSettings }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [width, setWidth] = useState(600);
  const [key, setKey] = useState(0);
  const send = useCallback(() => frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, settings: values }, window.location.origin), [values]);

  useEffect(() => {
    const t = setTimeout(send, 120);
    return () => clearTimeout(t);
  }, [send]);

  // the iframe announces itself once React mounted, then gets the current values
  useEffect(() => {
    const onMsg = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}-ready` && send();
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [send]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const virtual = mobile ? 390 : 1280;
  const scale = Math.min(1, width / virtual);
  const height = 720;

  const setPref = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
    setKey((n) => n + 1);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center gap-1 border-b border-line px-3 py-2 text-xs">
        <span className="me-auto text-muted">معاينة مباشرة</span>
        <button type="button" onClick={() => setPref("lang", "EN")} className="px-2 py-1 rounded-md hover:bg-surface-2">EN</button>
        <button type="button" onClick={() => setPref("lang", "AR")} className="px-2 py-1 rounded-md hover:bg-surface-2">ع</button>
        <button type="button" onClick={() => setPref("theme", "dark")} className="px-2 py-1 rounded-md hover:bg-surface-2">داكن</button>
        <button type="button" onClick={() => setPref("theme", "light")} className="px-2 py-1 rounded-md hover:bg-surface-2">فاتح</button>
        <span className="w-px h-4 bg-line mx-1" />
        <button type="button" onClick={() => setMobile(false)} aria-pressed={!mobile} className={`p-1.5 rounded-md ${!mobile ? "bg-surface-2" : "hover:bg-surface-2"}`} aria-label="كمبيوتر">
          <Monitor size={14} />
        </button>
        <button type="button" onClick={() => setMobile(true)} aria-pressed={mobile} className={`p-1.5 rounded-md ${mobile ? "bg-surface-2" : "hover:bg-surface-2"}`} aria-label="موبايل">
          <Smartphone size={14} />
        </button>
        <button type="button" onClick={() => setKey((n) => n + 1)} className="p-1.5 rounded-md hover:bg-surface-2" aria-label="إعادة تحميل">
          <RefreshCw size={14} />
        </button>
      </div>
      <div ref={box} className="relative bg-bg overflow-hidden" style={{ height: height * scale }}>
        <iframe
          key={key}
          ref={frame}
          src="/?preview=1"
          title="معاينة الموقع"
          onLoad={send}
          className="absolute top-0 border-0 origin-top-left"
          style={{ width: virtual, height, transform: `scale(${scale})`, left: mobile ? Math.max(0, (width - virtual * scale) / 2) : 0 }}
        />
      </div>
    </div>
  );
}

export default function SiteDesigner({ mode }: { mode: "design" | "seo" }) {
  const tabs = mode === "design" ? DESIGN_TABS : SEO_TABS;
  // ?tab=booking opens a tab directly (the bookings page links here)
  const [tab, setTab] = useState(() => {
    const want = new URLSearchParams(window.location.search).get("tab");
    return tabs.some((t) => t.id === want) ? want! : tabs[0].id;
  });
  const [values, setValues] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle<{ data: Partial<SiteSettings> }>()
      .then(({ data, error }) => {
        if (error) toast.error(`${error.message} — شغّلت ملف supabase/site-settings.sql؟`);
        const v = mergeSettings(data?.data);
        setValues(v);
        setSaved(JSON.stringify(v));
      });
  }, []);

  const dirty = !!values && JSON.stringify(values) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (k: keyof SiteSettings | string, v: unknown) => setValues((s) => (s ? { ...s, [k]: v } : s));
  const setMany = (patch: Partial<SiteSettings>) => setValues((s) => (s ? { ...s, ...patch } : s));

  const save = async () => {
    if (!values) return;
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ id: 1, data: values });
    setSaving(false);
    if (error) return toast.error(error.message);
    setSaved(JSON.stringify(values));
    toast.success("اتحفظ — الموقع اتحدث للزوار");
  };

  const reset = () => {
    if (!confirm(mode === "design" ? "ترجّع كل إعدادات الشكل للافتراضي؟ (مش هيتحفظ غير لما تدوس حفظ)" : "ترجّع إعدادات SEO للافتراضي؟")) return;
    const keys = tabs.flatMap((t) => [...(t.sections || []).flatMap((s) => s.fields.map((f) => f.key))]);
    const extra =
      mode === "design"
        ? (["accent", "accent_2", "booking_enabled", "booking_days", "booking_start", "booking_end", "booking_slot", "booking_days_ahead", "booking_blocked", "dark_bg", "dark_surface", "dark_fg", "light_bg", "light_surface", "light_fg", "font_latin", "font_arabic", "font_heading", "base_font_size", "heading_weight", "radius", "pill_buttons", "section_order", "hidden_sections"] as const)
        : [];
    setValues((s) => (s ? { ...s, ...Object.fromEntries([...keys, ...extra].map((k) => [k, DEFAULT_SETTINGS[k as keyof SiteSettings]])) } : s));
  };

  if (!values) {
    return (
      <div className="grid place-items-center py-24 text-faint">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const current = tabs.find((t) => t.id === tab) || tabs[0];

  return (
    <div>
      <PageHeader
        title={mode === "design" ? "شكل الموقع" : "SEO ومحركات البحث"}
        description={
          mode === "design" ? "الألوان والخطوط والأشكال والـ 3D وترتيب الأقسام ونصوصها. المعاينة بتتحدث وإنت بتعدّل، والزوار مش بيشوفوا حاجة غير لما تحفظ." : "إزاي موقعك بيظهر في جوجل ولما حد يشاركه."
        }
        action={
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:text-fg hover:bg-surface-2">
            <RotateCcw size={15} /> الافتراضي
          </button>
        }
      />

      <div className="flex flex-wrap gap-1.5 mb-5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-sm border ${tab === t.id ? "bg-fg text-bg border-fg" : "border-line text-muted hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`grid gap-5 items-start ${mode === "design" ? "2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""}`}>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
          {current.custom === "colors" && <ColorsEditor values={values} set={set} setMany={setMany} />}
          {current.custom === "fonts" && <FontsEditor values={values} set={set} />}
          {current.custom === "sections" && <SectionsEditor values={values} set={set} />}
          {current.custom === "booking" && <BookingEditor values={values} set={set} />}
          {current.custom === "seo-preview" && <SearchPreview values={values} />}
          {current.sections && <FormSections sections={current.sections} values={values} onChange={set} />}
        </div>
        {mode === "design" && (
          <div className="2xl:sticky 2xl:top-8">
            <LivePreview values={values} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 -mx-4 sm:mx-0 flex items-center justify-end gap-3 border-t sm:border sm:rounded-2xl border-line bg-bg/90 backdrop-blur px-4 py-3 z-10">
        {dirty && <span className="text-sm text-muted">فيه تعديلات مش محفوظة</span>}
        <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
          {saving && <Loader2 size={15} className="animate-spin" />}
          حفظ ونشر
        </button>
      </div>
    </div>
  );
}
