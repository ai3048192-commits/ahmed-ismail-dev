import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, MessageCircle, Copy, Check, Send, Loader2, RotateCw, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  lang?: string;
  isDark?: boolean;
};

/* --------------------------- بياناتك: عدّلها هنا --------------------------- */
const EMAIL = "ai3048192@gmail.com";
const WHATSAPP_NUMBER = "201026377928"; // من غير + أو مسافات
const WHATSAPP_DISPLAY = "+20 102 637 7928";
// اكتب مدة الرد الحقيقية بس. لو مش متأكد خليها "خلال يومين".
const REPLY_TIME = { en: "I usually reply within a day.", ar: "عادةً برد خلال يوم." };

const TOPICS = [
  { value: "project", en: "A web project", ar: "مشروع ويب" },
  { value: "frontend", en: "Frontend / UI work", ar: "شغل واجهات / UI" },
  { value: "job", en: "A job opportunity", ar: "فرصة شغل" },
  { value: "other", en: "Something else", ar: "حاجة تانية" },
];

const DRAFT_KEY = "contact-draft";
const MIN_MESSAGE = 15;
const MAX_MESSAGE = 2000;
const SPRING = { type: "spring" as const, stiffness: 320, damping: 30 };
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

type Form = { name: string; email: string; topic: string; message: string };
type Field = keyof Form;
type Status = "idle" | "sending" | "sent" | "error";

const emptyForm: Form = { name: "", email: "", topic: "project", message: "" };
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export default function Contact({ lang = "EN", isDark = true }: Props) {
  const isArabic = lang === "AR";
  const reduce = useReducedMotion();

  const [form, setForm] = useState<Form>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  const [copied, setCopied] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  // المسودة بتتحفظ: لو الزائر عمل refresh رسالته مش بتضيع
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setForm({ ...emptyForm, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      if (form.name || form.email || form.message) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  const T = (en: string, ar: string) => (isArabic ? ar : en);

  const errors: Partial<Record<Field, string>> = {
    name: form.name.trim().length < 2 ? T("Add your name.", "اكتب اسمك.") : undefined,
    email: !isEmail(form.email) ? T("Enter an email I can reply to.", "اكتب إيميل أقدر أرد عليه.") : undefined,
    message:
      form.message.trim().length < MIN_MESSAGE
        ? T(`A few more words, at least ${MIN_MESSAGE} characters.`, `كام كلمة كمان، ${MIN_MESSAGE} حرف على الأقل.`)
        : undefined,
  };
  const valid = !errors.name && !errors.email && !errors.message;
  const showError = (f: Field) => touched[f] && errors[f];

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((s) => ({ ...s, [f]: true }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!valid || status === "sending") return;
    // لو البوت ملى الحقل المخفي، نتظاهر إن الإرسال نجح
    if (honeypot.current?.value) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    const { error } = await supabase.from("messages").insert([
      {
        name: form.name.trim(),
        email: form.email.trim(),
        clearance: form.topic, // العمود القديم؛ غيّر اسمه لـ topic في Supabase لو تحب
        message: form.message.trim(),
      },
    ]);

    if (error) {
      console.error("Contact:", error.message);
      setStatus("error");
      return;
    }
    setSentTo(form.email.trim());
    setStatus("sent");
    setForm(emptyForm);
    setTouched({});
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  const t = {
    bg: isDark ? "bg-[#030712]" : "bg-[#f8fafc]",
    heading: isDark ? "text-white" : "text-slate-900",
    body: isDark ? "text-slate-400" : "text-slate-600",
    muted: isDark ? "text-slate-500" : "text-slate-400",
    accent: isDark ? "text-blue-400" : "text-blue-700",
    frame: isDark ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200",
    chrome: isDark ? "bg-[#070b16] border-slate-800" : "bg-slate-50 border-slate-200",
    line: isDark ? "border-slate-800" : "border-slate-200",
    label: isDark ? "text-slate-300" : "text-slate-700",
    input: isDark
      ? "bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 hover:border-slate-700 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600",
    inputErr: "border-red-500/70 focus:border-red-500",
    row: isDark ? "border-slate-800 hover:border-slate-700 hover:bg-slate-900/60" : "border-slate-200 hover:border-slate-300 hover:bg-white",
    iconBox: isDark ? "bg-slate-800/80 text-slate-200" : "bg-slate-100 text-slate-700",
  };

  const inputBase = `w-full rounded-lg border px-3 py-3 text-base sm:text-sm transition-colors outline-none focus:ring-4 ${
    isDark ? "focus:ring-blue-500/15" : "focus:ring-blue-600/10"
  }`;

  const messageLen = form.message.length;

  return (
    <section id="contact" dir={isArabic ? "rtl" : "ltr"} className={`py-28 px-6 lg:px-20 transition-colors duration-500 ${t.bg}`}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-14 lg:gap-20 items-start">
        {/* ---------------- الشمال: الكلام والقنوات المباشرة ---------------- */}
        <div className="text-start lg:sticky lg:top-28">
          <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${t.heading}`}>
            {T("Let's work together", "خلّينا نشتغل سوا")}
          </h2>
          <p className={`text-base leading-relaxed max-w-[44ch] ${t.body}`}>
            {T(
              "Have a project, a role, or a question? Send a message or reach me directly.",
              "عندك مشروع أو فرصة شغل أو سؤال؟ ابعت رسالة أو كلمني مباشرة."
            )}
          </p>
          <p className={`flex items-center gap-2 text-sm mt-5 ${t.muted}`}>
            <Clock size={14} />
            {isArabic ? REPLY_TIME.ar : REPLY_TIME.en}
          </p>

          <div className="mt-10 space-y-3">
            {/* الإيميل: الصف بيفتح mailto، والزرار الصغير بينسخ */}
            <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${t.row}`}>
              <a href={`mailto:${EMAIL}`} className={`flex items-center gap-3 flex-1 min-w-0 rounded-md ${focusRing}`}>
                <span className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${t.iconBox}`}>
                  <Mail size={18} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${t.heading}`}>{T("Email", "الإيميل")}</span>
                  <span dir="ltr" className={`block text-sm truncate ${t.body}`}>{EMAIL}</span>
                </span>
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={T("Copy email address", "انسخ الإيميل")}
                className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${focusRing} ${
                  isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "done" : "copy"}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={`inline-flex items-center gap-1.5 ${copied ? "text-emerald-500" : ""}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? T("Copied", "اتنسخ") : T("Copy", "انسخ")}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${t.row} ${focusRing}`}
            >
              <span className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${t.iconBox}`}>
                <MessageCircle size={18} />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${t.heading}`}>WhatsApp</span>
                <span dir="ltr" className={`block text-sm ${t.body} ${isArabic ? "text-right" : ""}`}>{WHATSAPP_DISPLAY}</span>
              </span>
            </a>
          </div>
        </div>

        {/* ---------------- اليمين: نافذة الرسالة ---------------- */}
        <div className={`rounded-xl border overflow-hidden ${t.frame} ${isDark ? "shadow-[0_40px_100px_-40px_rgba(37,99,235,0.35)]" : "shadow-[0_40px_80px_-40px_rgba(15,23,42,0.3)]"}`}>
          <div className={`flex items-center gap-3 px-4 py-3 border-b ${t.chrome}`}>
            <div dir="ltr" className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span dir="ltr" className={`font-mono text-xs ${t.muted}`}>~/contact/new-message.md</span>
            {status === "idle" && (form.name || form.message) && (
              <span className={`ms-auto text-xs ${t.muted}`}>{T("Draft saved", "المسودة محفوظة")}</span>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {status === "sent" ? (
              /* ---------------- حالة النجاح ---------------- */
              <motion.div
                key="sent"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-8 sm:p-10 min-h-[480px] flex flex-col justify-center"
                role="status"
              >
                <div dir="ltr" className={`font-mono text-sm space-y-1.5 mb-8 ${isArabic ? "text-right" : ""}`}>
                  <p className={t.muted}>$ send --to {EMAIL.split("@")[0]}</p>
                  <motion.p
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-emerald-500"
                  >
                    ✓ message delivered
                  </motion.p>
                </div>
                <h3 className={`text-2xl font-bold tracking-tight mb-3 ${t.heading}`}>{T("Message sent", "الرسالة اتبعتت")}</h3>
                <p className={`text-base leading-relaxed max-w-[48ch] ${t.body}`}>
                  {sentTo
                    ? T(`Thanks. I'll reply to ${sentTo}.`, `شكرًا. هرد عليك على ${sentTo}.`)
                    : T("Thanks. I'll get back to you soon.", "شكرًا. هرد عليك قريب.")}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className={`self-start mt-8 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${focusRing} ${
                    isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800/70" : "border-slate-300 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {T("Send another message", "ابعت رسالة تانية")}
                </button>
              </motion.div>
            ) : (
              /* ---------------- الفورم ---------------- */
              <motion.form
                key="form"
                onSubmit={submit}
                noValidate
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* حقل مخفي لاصطياد البوتات */}
                <input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FieldWrap id="c-name" label={T("Your name", "اسمك")} error={showError("name")} t={t}>
                    <input
                      id="c-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={set("name")}
                      onBlur={blur("name")}
                      aria-invalid={!!showError("name")}
                      aria-describedby={showError("name") ? "c-name-err" : undefined}
                      placeholder={T("Sara Ahmed", "سارة أحمد")}
                      className={`${inputBase} ${t.input} ${showError("name") ? t.inputErr : ""}`}
                    />
                  </FieldWrap>
                  <FieldWrap id="c-email" label={T("Email", "الإيميل")} error={showError("email")} t={t}>
                    <input
                      id="c-email"
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      inputMode="email"
                      value={form.email}
                      onChange={set("email")}
                      onBlur={blur("email")}
                      aria-invalid={!!showError("email")}
                      aria-describedby={showError("email") ? "c-email-err" : undefined}
                      placeholder="you@company.com"
                      className={`${inputBase} ${t.input} ${showError("email") ? t.inputErr : ""} ${isArabic ? "text-right" : ""}`}
                    />
                  </FieldWrap>
                </div>

                {/* الموضوع: اختيارات ظاهرة بدل select */}
                <fieldset>
                  <legend className={`text-sm font-medium mb-2.5 ${t.label}`}>{T("What's it about?", "الرسالة عن إيه؟")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((tp) => {
                      const on = form.topic === tp.value;
                      return (
                        <label
                          key={tp.value}
                          className={`relative cursor-pointer rounded-lg border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-400 ${
                            on
                              ? isDark
                                ? "border-blue-500/60 text-white"
                                : "border-blue-600/50 text-blue-900"
                              : isDark
                              ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                              : "border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          {on && (
                            <motion.span
                              layoutId="contact-topic"
                              className={`absolute inset-0 rounded-[7px] ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}
                              transition={reduce ? { duration: 0 } : SPRING}
                            />
                          )}
                          <input
                            type="radio"
                            name="topic"
                            value={tp.value}
                            checked={on}
                            onChange={() => setForm((s) => ({ ...s, topic: tp.value }))}
                            className="sr-only"
                          />
                          <span className="relative">{isArabic ? tp.ar : tp.en}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <FieldWrap id="c-message" label={T("Message", "رسالتك")} error={showError("message")} t={t}>
                  <textarea
                    id="c-message"
                    rows={6}
                    maxLength={MAX_MESSAGE}
                    value={form.message}
                    onChange={set("message")}
                    onBlur={blur("message")}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                    }}
                    aria-invalid={!!showError("message")}
                    aria-describedby={showError("message") ? "c-message-err" : "c-message-hint"}
                    placeholder={T(
                      "What are you building, and where could I help?",
                      "بتبني إيه، وأقدر أساعد في إيه؟"
                    )}
                    className={`${inputBase} ${t.input} resize-y min-h-[150px] leading-relaxed ${showError("message") ? t.inputErr : ""}`}
                  />
                  <div id="c-message-hint" className={`flex justify-between gap-4 mt-2 text-xs ${t.muted}`}>
                    <span className="hidden sm:inline" dir="ltr">
                      Ctrl + Enter {T("to send", "للإرسال")}
                    </span>
                    <span dir="ltr" className={`tabular-nums ms-auto ${messageLen > MAX_MESSAGE * 0.9 ? "text-amber-500" : ""}`}>
                      {messageLen} / {MAX_MESSAGE}
                    </span>
                  </div>
                </FieldWrap>

                <AnimatePresence>
                  {status === "error" && (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                      role="alert"
                    >
                      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                        <RotateCw size={15} className="mt-0.5 shrink-0" />
                        <span>
                          {T(
                            `The message didn't go through. Your text is still here, so try again, or email me at ${EMAIL}.`,
                            `الرسالة ما اتبعتتش. كلامك لسه موجود، جرّب تاني أو ابعتلي على ${EMAIL}.`
                          )}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={status === "sending"}
                  whileTap={reduce ? undefined : { scale: 0.985 }}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-80 disabled:cursor-wait text-white text-sm font-semibold transition-colors ${focusRing} focus-visible:ring-offset-2 ${isDark ? "focus-visible:ring-offset-[#0b1120]" : "focus-visible:ring-offset-white"}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={status === "sending" ? "sending" : "idle"}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex items-center gap-2"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {T("Sending...", "بيتبعت...")}
                        </>
                      ) : (
                        <>
                          <Send size={15} className={isArabic ? "-scale-x-100" : ""} />
                          {status === "error" ? T("Try again", "جرّب تاني") : T("Send message", "ابعت الرسالة")}
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ غلاف الحقل ------------------------------ */
function FieldWrap({
  id,
  label,
  error,
  t,
  children,
}: {
  id: string;
  label: string;
  error?: string | false;
  t: { label: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium mb-2 ${t.label}`}>
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-err`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-500 mt-1.5 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}