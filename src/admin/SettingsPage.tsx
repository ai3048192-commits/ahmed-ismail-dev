import { useState } from "react";
import { BellRing, Bot, Download, KeyRound, Loader2, Rocket, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { input, Label } from "./fields";
import { Card, PageHeader } from "./ui";

const TABLES = ["site_settings", "profile", "projects", "skills", "experience", "services", "testimonials", "posts", "packages", "faqs", "messages", "bookings", "visits", "events"];

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState("");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("الباسورد لازم يكون 8 حروف على الأقل");
    if (password !== confirmPw) return toast.error("الباسوردين مش زي بعض");
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy("");
    if (error) return toast.error(error.message);
    setPassword("");
    setConfirmPw("");
    toast.success("الباسورد اتغير");
  };

  const exportBackup = async () => {
    setBusy("backup");
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t).select("*");
      out[t] = error ? { error: error.message } : data;
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy("");
  };

  // Vercel deploy hooks accept a bare POST; the response can't be read cross-origin, so no-cors
  const rebuild = async () => {
    setBusy("deploy");
    const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle<{ data: { deploy_hook_url?: string } }>();
    const hook = data?.data?.deploy_hook_url?.trim();
    if (!hook) {
      setBusy("");
      return toast.error("حط رابط الـ Deploy Hook الأول من «SEO ومحركات البحث»");
    }
    try {
      await fetch(hook, { method: "POST", mode: "no-cors" });
      toast.success("بدأ النشر — الموقع هيتحدث خلال دقيقة أو اتنين");
    } catch {
      toast.error("النشر ما بدأش. اتأكد من الرابط.");
    }
    setBusy("");
  };

  const testFunction = async (name: "notify" | "chat") => {
    setBusy(name);
    const { data, error } = await supabase.functions.invoke(name, name === "chat" ? { body: { messages: [{ role: "user", text: "hi" }], lang: "AR" } } : undefined);
    setBusy("");
    const status = (error as { context?: Response } | null)?.context?.status;
    if (!error) return toast.success(name === "chat" ? "المساعد شغال" : `الإشعارات شغالة (اتبعت ${(data as { sent?: number })?.sent ?? 0})`);
    if (status === 503) return toast.error(name === "chat" ? "مفتاح Gemini مش متحط في أسرار Supabase" : "مفيش قناة إشعارات متظبطة (تيليجرام أو إيميل)");
    if (status === 404 || !status) return toast.error("الـ function مش متركبة على Supabase لسه — شوف README");
    toast.error(`حصل خطأ (${status})`);
  };

  const clearVisits = async () => {
    if (!confirm("تمسح كل سجل الزيارات؟ الإحصائيات هتبدأ من الصفر.")) return;
    setBusy("visits");
    const { error } = await supabase.from("visits").delete().gte("id", 0);
    setBusy("");
    if (error) return toast.error(error.message);
    toast.success("سجل الزيارات اتمسح");
  };

  return (
    <div>
      <PageHeader title="الإعدادات" description="الحساب والنسخ الاحتياطي." />
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card title="تغيير الباسورد">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <Label htmlFor="pw">الباسورد الجديد</Label>
              <input id="pw" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <div>
              <Label htmlFor="pw2">أكّد الباسورد</Label>
              <input id="pw2" type="password" dir="ltr" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy === "password"} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy === "password" ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              غيّر الباسورد
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card title="نسخة احتياطية">
            <p className="text-sm text-muted mb-4">نزّل كل بيانات الموقع (المشاريع، المهارات، الرسائل، ...) في ملف JSON واحد.</p>
            <button type="button" onClick={exportBackup} disabled={busy === "backup"} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-surface-2 disabled:opacity-60">
              {busy === "backup" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              تحميل النسخة
            </button>
          </Card>

          <Card title="نشر الموقع">
            <p className="text-sm text-muted mb-4">بيعيد بناء الموقع على Vercel عشان صور وعناوين المشاركة (فيسبوك وواتساب) تتحدث بعد ما تضيف مشروع أو مقال.</p>
            <button type="button" onClick={rebuild} disabled={busy === "deploy"} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy === "deploy" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
              انشر الموقع من جديد
            </button>
          </Card>

          <Card title="اختبار الخدمات">
            <p className="text-sm text-muted mb-4">اتأكد إن الإشعارات (تيليجرام والإيميل) والمساعد الذكي متركبين صح على Supabase.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => testFunction("notify")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-surface-2 disabled:opacity-60">
                {busy === "notify" ? <Loader2 size={15} className="animate-spin" /> : <BellRing size={15} />}
                اختبر الإشعارات
              </button>
              <button type="button" onClick={() => testFunction("chat")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-surface-2 disabled:opacity-60">
                {busy === "chat" ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
                اختبر المساعد
              </button>
            </div>
          </Card>

          <Card title="سجل الزيارات">
            <p className="text-sm text-muted mb-4">كل زائر بيتسجل مرة واحدة في كل جلسة. ممكن تمسح السجل لو عايز تبدأ العد من جديد.</p>
            <button type="button" onClick={clearVisits} disabled={busy === "visits"} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-danger hover:bg-surface-2 disabled:opacity-60">
              {busy === "visits" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              امسح سجل الزيارات
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
