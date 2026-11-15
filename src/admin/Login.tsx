import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { useSettings } from "../lib/site-settings";
import { supabase } from "../lib/supabase";
import { checkAdmin } from "./useAdmin";
import { input, Label } from "./fields";

export default function Login() {
  const { settings: s } = useSettings();
  const brand = s.brand_name_ar || s.brand_name_en || "AI";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setBusy(false);
      setError(authError.message === "Invalid login credentials" ? "الإيميل أو الباسورد غلط." : authError.message);
      return;
    }
    // valid account, but only the admin list may enter
    if (!(await checkAdmin())) {
      await supabase.auth.signOut();
      setError("الحساب ده مش أدمن. الدخول للأدمن بس.");
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 gap-3 p-3">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-3xl bg-fg p-10 text-bg">
        <p className="font-display text-lg font-bold">{brand}</p>
        <div>
          <span aria-hidden className="block h-1.5 w-16 rounded-full bg-accent" />
          <p className="mt-6 max-w-[14ch] font-display text-5xl font-bold leading-[1.05] tracking-tight">كل حاجة في موقعك، من مكان واحد.</p>
        </div>
      </div>

      <div className="grid place-items-center px-2 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-fg">
            <Lock size={20} />
          </span>
          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-muted">الدخول للأدمن بس.</p>

          <div className="mt-10 space-y-4">
            <div>
              <Label htmlFor="email">الإيميل</Label>
              <input id="email" type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} !py-3`} />
            </div>
            <div>
              <Label htmlFor="password">الباسورد</Label>
              <input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} !py-3`} />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-pill bg-accent text-accent-fg py-3.5 text-sm font-semibold shadow-[0_16px_40px_-18px_var(--accent)] disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />}
            دخول
          </button>
          <Link to="/" className="mt-6 block text-center text-xs text-faint hover:text-fg">
            رجوع للموقع
          </Link>
        </form>
      </div>
    </main>
  );
}
