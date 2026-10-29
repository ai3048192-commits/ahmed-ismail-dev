import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { DEFAULT_PROFILE } from "../site/useSiteData";
import { FormSections, type FormSection } from "./form";
import { pair } from "./resources";
import { PageHeader } from "./ui";

const SECTIONS: FormSection[] = [
  {
    title: "الهوية",
    fields: [
      ...pair("full_name", "الاسم الكامل"),
      ...pair("role", "المسمى الوظيفي"),
      ...pair("location", "المكان"),
      { key: "years_experience", label: "سنين الخبرة", type: "number", half: true },
      { key: "available", label: "متاح لمشاريع جديدة", hint: "بيظهر شارة خضرا في أول الصفحة", type: "toggle", half: true },
    ],
  },
  {
    title: "الواجهة (أول حاجة الزائر بيشوفها)",
    fields: [...pair("hero_title", "العنوان الرئيسي", "textarea"), ...pair("hero_desc", "الوصف تحت العنوان", "textarea"), ...pair("about", "نبذة قصيرة في كارت البروفايل", "textarea")],
  },
  {
    title: "الصور والملفات",
    fields: [
      { key: "avatar_url", label: "صورتك الشخصية", type: "media", folder: "profile", half: true },
      { key: "logo_url", label: "اللوجو", hint: "لو فاضي بيظهر أول حرفين من اسمك", type: "media", folder: "profile", half: true },
      { key: "cv_url", label: "ملف الـ CV", hint: "PDF — زرار التحميل في الموقع بيفتح الملف ده", type: "media", folder: "cv", accept: "application/pdf" },
    ],
  },
  {
    title: "التواصل",
    fields: [
      { key: "email", label: "الإيميل", type: "email", half: true },
      { key: "whatsapp", label: "رقم الواتساب", hint: "بكود الدولة، مثال: 201012345678", type: "text", lang: "en", half: true },
      ...pair("reply_time", "مدة الرد"),
    ],
  },
  {
    title: "السوشيال ميديا (اللي يفضل فاضي مش بيظهر)",
    fields: [
      { key: "github_url", label: "GitHub", type: "url", half: true },
      { key: "linkedin_url", label: "LinkedIn", type: "url", half: true },
      { key: "x_url", label: "X / Twitter", type: "url", half: true },
      { key: "facebook_url", label: "Facebook", type: "url", half: true },
    ],
  },
  {
    title: "المساعد الذكي",
    fields: [
      { key: "chat_enabled", label: "تشغيل المساعد في الموقع", type: "toggle" },
      {
        key: "chat_context",
        label: "معلومات إضافية للمساعد",
        hint: "أي حاجة عايز المساعد يعرفها ويرد بيها (أسعار تقريبية، مواعيد شغل، ...). بيعرف لوحده المشاريع والمهارات والخدمات.",
        type: "textarea",
      },
    ],
  },
];

export default function ProfilePage() {
  const [values, setValues] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle<Profile>()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        const v = { ...DEFAULT_PROFILE, ...(data || {}) };
        setValues(v);
        setSaved(JSON.stringify(v));
      });
  }, []);

  const dirty = values && JSON.stringify(values) !== saved;

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    const { updated_at: _skip, ...payload } = values; // eslint-disable-line @typescript-eslint/no-unused-vars
    const { error } = await supabase.from("profile").upsert({ ...payload, id: 1, years_experience: payload.years_experience ?? 0 });
    setSaving(false);
    if (error) return toast.error(error.message);
    setSaved(JSON.stringify(values));
    toast.success("اتحفظ — الموقع اتحدث");
  };

  if (!values) {
    return (
      <div className="grid place-items-center py-24 text-faint">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <PageHeader title="البيانات الشخصية" description="كل النصوص والروابط اللي بتظهر في الموقع كله." />
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <FormSections sections={SECTIONS} values={values} onChange={(k, v) => setValues((s) => (s ? { ...s, [k]: v } : s))} />
      </div>
      <div className="sticky bottom-0 mt-4 -mx-4 sm:mx-0 flex items-center justify-end gap-3 border-t sm:border sm:rounded-2xl border-line bg-bg/90 backdrop-blur px-4 py-3">
        {dirty && <span className="text-sm text-muted">فيه تعديلات مش محفوظة</span>}
        <button type="submit" disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
          {saving && <Loader2 size={15} className="animate-spin" />}
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
}
