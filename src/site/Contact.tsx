import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { pingNotify, supabase, track } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { waLink } from "./useSiteData";
import { Reveal } from "./Effects";
import { Section, SectionHeading } from "./ui";
import { btn, tile } from "./styles";

const TOPICS = [
  { value: "project", en: "A web project", ar: "مشروع ويب" },
  { value: "frontend", en: "Frontend / UI work", ar: "شغل واجهات" },
  { value: "job", en: "A job opportunity", ar: "فرصة شغل" },
  { value: "other", en: "Something else", ar: "حاجة تانية" },
];
const DRAFT_KEY = "contact-draft";
const MIN_MESSAGE = 15;
const MAX_MESSAGE = 2000;

type Form = { name: string; email: string; topic: string; message: string };
type Field = keyof Form;
const emptyForm: Form = { name: "", email: "", topic: "project", message: "" };
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const field =
  "w-full rounded-2xl border border-line bg-bg/60 px-4 py-3.5 text-fg placeholder:text-faint outline-none transition-colors focus:border-accent";

export default function Contact({ profile, index }: { profile: Profile; index: string }) {
  const { pick, isAr } = usePrefs();
  // the draft survives a refresh
  const [form, setForm] = useState<Form>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...emptyForm, ...JSON.parse(saved) } : emptyForm;
    } catch {
      return emptyForm;
    }
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (form.name || form.email || form.message) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  const errors: Partial<Record<Field, string>> = {
    name: form.name.trim().length < 2 ? pick("Add your name.", "اكتب اسمك.") : undefined,
    email: !isEmail(form.email) ? pick("Enter an email I can reply to.", "اكتب إيميل أقدر أرد عليه.") : undefined,
    message:
      form.message.trim().length < MIN_MESSAGE
        ? pick(`A few more words — at least ${MIN_MESSAGE} characters.`, `كام كلمة كمان — ${MIN_MESSAGE} حرف على الأقل.`)
        : undefined,
  };
  const valid = !errors.name && !errors.email && !errors.message;
  const show = (f: Field) => touched[f] && errors[f];
  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((s) => ({ ...s, [f]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!valid || status === "sending") return;
    if (honeypot.current?.value) {
      setStatus("sent"); // a bot filled the hidden field: pretend it worked
      return;
    }
    setStatus("sending");
    const { error } = await supabase.from("messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      topic: form.topic,
      message: form.message.trim(),
    });
    if (error) {
      console.error("Contact:", error.message);
      setStatus("error");
      return;
    }
    pingNotify();
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
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <Section id="contact">
      <SectionHeading section="contact" index={index} fallbackIntro={pick(profile.reply_time_en, profile.reply_time_ar)} />

      {profile.email && (
        <Reveal className="mb-12">
          <p className="font-mono text-xs uppercase ltr:tracking-[0.2em] text-faint mb-4">{pick("Write to me", "ابعتلي على")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${profile.email}`}
              onClick={() => track("email_click", "contact")}
              dir="ltr"
              className="group relative font-display text-[clamp(1.6rem,6vw,5rem)] leading-none tracking-tight break-all text-grad"
            >
              {profile.email}
              <span aria-hidden className="absolute -bottom-2 left-0 h-[3px] w-full origin-left scale-x-0 bg-grad transition-transform duration-500 group-hover:scale-x-100" />
            </a>
            <button type="button" onClick={copyEmail} className={btn.icon} aria-label={pick("Copy address", "انسخ العنوان")}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </Reveal>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-3">
          {profile.whatsapp && (
            <a
              href={waLink(profile.whatsapp, pick("Hi Ahmed, I saw your portfolio.", "أهلاً أحمد، شفت البورتفوليو بتاعك."))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", "contact")}
              className="group relative overflow-hidden rounded-3xl bg-grad text-white p-7 flex flex-1 flex-col justify-between gap-12 min-h-[240px] shadow-[0_30px_70px_-30px_var(--accent)]"
            >
              <span aria-hidden className="absolute -end-10 -bottom-10 h-48 w-48 rounded-full bg-white/15 transition-transform duration-700 group-hover:scale-150" />
              <span className="relative flex items-center justify-between">
                <MessageCircle size={28} />
                <ArrowUpRight size={22} className="transition-transform duration-500 group-hover:rotate-45 rtl:-scale-x-100" />
              </span>
              <span className="relative">
                <span className="block text-sm opacity-70">{pick("Fastest reply", "أسرع رد")}</span>
                <span className="block font-display text-4xl tracking-tight mt-1">WhatsApp</span>
                <span className="block font-mono text-sm mt-2 opacity-80" dir="ltr">
                  +{profile.whatsapp.replace(/\D/g, "")}
                </span>
              </span>
            </a>
          )}
          <div className={`${tile} p-7`}>
            <Mail size={22} className="text-accent-ink" />
            <p className="mt-6 text-sm text-muted leading-relaxed">{pick(profile.reply_time_en, profile.reply_time_ar)}</p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className={`${tile} p-6 sm:p-10`}>
          {status === "sent" ? (
            <div role="status" className="h-full min-h-[380px] flex flex-col items-center justify-center text-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-grad text-white">
                <Check size={26} />
              </span>
              <p className="text-xl font-semibold">{pick("Message sent.", "الرسالة وصلت.")}</p>
              <p className="text-muted max-w-sm">{pick(profile.reply_time_en, profile.reply_time_ar)}</p>
              <button type="button" onClick={() => setStatus("idle")} className={`${btn.ghost} mt-2`}>
                {pick("Send another", "ابعت رسالة تانية")}
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              <fieldset>
                <legend className="text-sm text-muted mb-3">{pick("What's it about?", "الموضوع عن إيه؟")}</legend>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <label
                      key={t.value}
                      className={`cursor-pointer rounded-pill border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-chart ${
                        form.topic === t.value ? "bg-grad text-white border-transparent" : "border-line text-muted hover:text-fg"
                      }`}
                    >
                      <input type="radio" name="topic" value={t.value} checked={form.topic === t.value} onChange={set("topic")} className="sr-only" />
                      {isAr ? t.ar : t.en}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                {(["name", "email"] as const).map((f) => (
                  <div key={f}>
                    <label htmlFor={`c-${f}`} className="block text-sm text-muted mb-2">
                      {f === "name" ? pick("Your name", "اسمك") : pick("Your email", "إيميلك")}
                    </label>
                    <input
                      id={`c-${f}`}
                      type={f === "email" ? "email" : "text"}
                      dir={f === "email" ? "ltr" : undefined}
                      autoComplete={f}
                      value={form[f]}
                      onChange={set(f)}
                      onBlur={blur(f)}
                      aria-invalid={!!show(f)}
                      aria-describedby={show(f) ? `c-${f}-err` : undefined}
                      className={`${field} ${show(f) ? "!border-danger" : ""}`}
                    />
                    {show(f) && (
                      <p id={`c-${f}-err`} className="text-xs text-danger mt-1.5">
                        {errors[f]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="c-message" className="block text-sm text-muted mb-2">
                  {pick("Message", "رسالتك")}
                </label>
                <textarea
                  id="c-message"
                  rows={6}
                  maxLength={MAX_MESSAGE}
                  value={form.message}
                  onChange={set("message")}
                  onBlur={blur("message")}
                  aria-invalid={!!show("message")}
                  placeholder={pick("A few lines about what you need and when.", "كام سطر عن اللي محتاجه وإمتى.")}
                  className={`${field} resize-y ${show("message") ? "!border-danger" : ""}`}
                />
                <div className="flex justify-between gap-4 mt-1.5 text-xs">
                  <span className="text-danger">{show("message") && errors.message}</span>
                  <span className="text-faint font-mono tabular-nums">
                    {form.message.length}/{MAX_MESSAGE}
                  </span>
                </div>
              </div>

              {/* hidden from people, bots fill it */}
              <input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

              {status === "error" && (
                <p role="alert" className="text-sm text-danger">
                  {pick("That didn't go through. Try again, or use WhatsApp.", "الرسالة موصلتش. جرب تاني أو كلمني واتساب.")}
                </p>
              )}

              <button type="submit" disabled={status === "sending"} className={`${btn.primary} w-full sm:w-auto sm:justify-self-start disabled:opacity-60`}>
                {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rtl:-scale-x-100" />}
                {status === "sending" ? pick("Sending…", "بيتبعت…") : pick("Send message", "ابعت الرسالة")}
              </button>
            </div>
          )}
        </form>
      </div>
    </Section>
  );
}
