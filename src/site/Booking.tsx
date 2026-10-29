import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, Globe, Loader2, Moon, Pencil, RotateCcw, Sun, Sunset } from "lucide-react";
import { availableDays } from "../lib/booking";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { pingNotify, supabase, track } from "../lib/supabase";
import { Monogram } from "./Header";
import { useSite } from "./SiteData";
import { btn } from "./styles";
import { Section, SectionHeading } from "./ui";

const field = "w-full rounded-2xl border border-line bg-bg/60 px-4 py-3 text-fg placeholder:text-faint outline-none transition-colors focus:border-accent";
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** a visitor-local calendar date, so the grid matches the visitor's own days */
const localKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

function googleCalendarLink(start: Date, minutes: number, title: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + minutes * 60000);
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${fmt(start)}/${fmt(end)}` })}`;
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const { pick } = usePrefs();
  const items = [pick("Day", "اليوم"), pick("Time", "الساعة"), pick("Your details", "بياناتك")];
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {items.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const on = n === step;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span className={`flex items-center gap-2 text-xs sm:text-sm ${on ? "text-fg font-medium" : done ? "text-muted" : "text-faint"}`}>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold transition-all ${
                  done ? "bg-grad text-white" : on ? "bg-grad text-white shadow-[0_6px_18px_-6px_var(--accent)]" : "border border-line"
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} /> : n}
              </span>
              {label}
            </span>
            {n < 3 && <span className={`h-px w-4 sm:w-8 ${done ? "bg-grad" : "bg-line"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export default function Booking({ index }: { index: string }) {
  const { pick, isAr } = usePrefs();
  const { settings: s } = useSettings();
  const { profile } = useSite();
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [dayKey, setDayKey] = useState("");
  const [slot, setSlot] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", note: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error" | "taken">("idle");
  const [refresh, setRefresh] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const locale = isAr ? "ar-EG" : "en-US";
  const visitorZone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
  const minutes = Number(s.booking_slot) || 30;

  useEffect(() => {
    const from = new Date();
    const to = new Date(from.getTime() + (Number(s.booking_days_ahead) + 2) * 86400_000);
    supabase.rpc("booked_slots", { p_from: from.toISOString(), p_to: to.toISOString() }).then(({ data, error }) => {
      if (error) console.warn("Booked slots:", error.message);
      setTaken(new Set(((data as { start_at: string }[]) || []).map((b) => new Date(b.start_at).getTime())));
    });
  }, [s.booking_days_ahead, refresh]);

  // regroup the host's slots by the visitor's own calendar days
  const byDay = useMemo(() => {
    const m = new Map<string, Date[]>();
    availableDays(s, taken)
      .flatMap((d) => d.slots)
      .forEach((t) => m.set(localKey(t), [...(m.get(localKey(t)) || []), t]));
    return m;
  }, [s, taken]);
  const firstDay = byDay.values().next().value?.[0] as Date | undefined;
  const lastDay = [...byDay.values()].at(-1)?.[0];
  const shownMonth = month || firstDay || new Date();
  const selectedKey = dayKey && byDay.has(dayKey) ? dayKey : "";
  const daySlots = selectedKey ? byDay.get(selectedKey)! : [];
  const step: 1 | 2 | 3 = slot ? 3 : selectedKey ? 2 : 1;

  // the month grid; Arabic weeks start on Saturday
  const weekStart = isAr ? 6 : 0;
  const cells = useMemo(() => {
    const first = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
    const lead = (first.getDay() - weekStart + 7) % 7;
    const count = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(shownMonth.getFullYear(), shownMonth.getMonth(), i + 1))];
  }, [shownMonth, weekStart]);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + ((i + weekStart) % 7)).toLocaleDateString(locale, { weekday: "short" }));
  const canPrev = firstDay && !sameMonth(shownMonth, firstDay) && shownMonth > firstDay;
  const canNext = lastDay && !sameMonth(shownMonth, lastDay) && shownMonth < lastDay;
  const shiftMonth = (d: number) => setMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + d, 1));

  const periods = [
    { key: "morning", label: pick("Morning", "الصبح"), Icon: Sun, items: daySlots.filter((t) => t.getHours() < 12) },
    { key: "afternoon", label: pick("Afternoon", "بعد الضهر"), Icon: Sunset, items: daySlots.filter((t) => t.getHours() >= 12 && t.getHours() < 17) },
    { key: "evening", label: pick("Evening", "بالليل"), Icon: Moon, items: daySlots.filter((t) => t.getHours() >= 17) },
  ].filter((p) => p.items.length);

  const pickSlot = (t: Date) => {
    setSlot(t);
    // on small screens the form sits below; bring it into view
    if (window.matchMedia("(max-width: 1023px)").matches) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot || form.name.trim().length < 2 || !isEmail(form.email)) return;
    setStatus("sending");
    const { error } = await supabase.from("bookings").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      topic: form.topic.trim(),
      note: form.note.trim(),
      start_at: slot.toISOString(),
      duration_min: minutes,
    });
    if (error) {
      // the unique index rejects a slot someone else just took
      setStatus(error.code === "23505" ? "taken" : "error");
      setRefresh((n) => n + 1);
      setSlot(null);
      return;
    }
    track("booking_made", slot.toISOString());
    pingNotify();
    setStatus("done");
  };

  const reset = () => {
    setStatus("idle");
    setSlot(null);
    setDayKey("");
    setForm({ name: "", email: "", phone: "", topic: "", note: "" });
    setRefresh((n) => n + 1);
  };

  if (!s.booking_enabled) return null;

  const when = (t: Date) => t.toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
  const name = pick(profile.full_name_en, profile.full_name_ar);

  return (
    <Section id="booking">
      <SectionHeading section="booking" index={index} />
      <div className="glass relative mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
        <div aria-hidden className="absolute -top-32 -end-32 h-72 w-72 rounded-full bg-grad opacity-20 blur-[90px]" />

        <AnimatePresence mode="wait">
          {status === "done" && slot ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} role="status" className="relative px-6 py-16 sm:py-20 text-center">
              <motion.span
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-grad text-white shadow-[0_24px_60px_-18px_var(--accent)]"
              >
                <CalendarCheck size={34} />
              </motion.span>
              <h3 className="mt-7 font-display text-3xl sm:text-4xl tracking-tight">{pick("You're booked!", "الحجز اتسجل!")}</h3>
              <p className="mt-3 text-lg">{when(slot)}</p>
              <p className="mt-1 text-sm text-muted">
                {minutes} {pick("minutes with", "دقيقة مع")} {name}
              </p>
              <p className="mt-4 text-sm text-faint">{pick("I'll confirm by email shortly.", "هأكدلك على الإيميل قريب.")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={googleCalendarLink(slot, minutes, pick(`Call with ${name}`, `مكالمة مع ${name}`))} target="_blank" rel="noopener noreferrer" className={btn.primary}>
                  <CalendarPlus size={16} /> {pick("Add to Google Calendar", "ضيفه لجوجل كالندر")}
                </a>
                <button type="button" onClick={reset} className={btn.ghost}>
                  <RotateCcw size={15} /> {pick("Book another time", "احجز ميعاد تاني")}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" className="relative">
              {/* who / how long / which timezone, plus where you are in the flow */}
              <div className="flex flex-wrap items-center justify-between gap-5 border-b border-line px-5 sm:px-8 py-5">
                <div className="flex items-center gap-3.5">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover" /> : <Monogram profile={profile} size={48} />}
                  <div>
                    <p className="font-semibold leading-tight">{pick(`Call with ${name.split(" ")[0]}`, `مكالمة مع ${name.split(" ")[0]}`)}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {minutes} {pick("min", "دقيقة")}
                      </span>
                      <span className="flex items-center gap-1" dir="ltr">
                        <Globe size={12} /> {visitorZone}
                      </span>
                    </p>
                  </div>
                </div>
                <Steps step={step} />
              </div>

              {byDay.size === 0 ? (
                <p className="m-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
                  {pick("No open times right now — send a message instead.", "مفيش مواعيد فاضية دلوقتي — ابعت رسالة بدل كده.")}
                </p>
              ) : (
                <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,1.1fr)]">
                  {/* 1. calendar */}
                  <div className="p-5 sm:p-7 lg:border-e border-line">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg">{shownMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}</p>
                      <div className="flex gap-1">
                        <button type="button" disabled={!canPrev} onClick={() => shiftMonth(-1)} aria-label={pick("Previous month", "الشهر اللي فات")} className={`${btn.icon} !h-9 !w-9 disabled:opacity-30`}>
                          {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                        <button type="button" disabled={!canNext} onClick={() => shiftMonth(1)} aria-label={pick("Next month", "الشهر الجاي")} className={`${btn.icon} !h-9 !w-9 disabled:opacity-30`}>
                          {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={pick("Pick a day", "اختار اليوم")}>
                      {weekdays.map((w) => (
                        <span key={w} className="pb-2 text-[11px] text-faint">
                          {w}
                        </span>
                      ))}
                      {cells.map((d, i) => {
                        if (!d) return <span key={`e${i}`} />;
                        const k = localKey(d);
                        const open = byDay.has(k);
                        const on = k === selectedKey;
                        const today = k === localKey(new Date());
                        return (
                          <button
                            key={k}
                            type="button"
                            disabled={!open}
                            aria-pressed={on}
                            aria-label={d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                            onClick={() => {
                              setDayKey(k);
                              setSlot(null);
                            }}
                            className={`relative aspect-square rounded-xl text-sm tabular-nums transition-all ${
                              on
                                ? "bg-grad text-white font-semibold shadow-[0_10px_24px_-10px_var(--accent)]"
                                : open
                                  ? "bg-surface-2/70 text-fg font-medium hover:bg-surface-2 hover:-translate-y-0.5"
                                  : "text-faint/50 cursor-default"
                            }`}
                          >
                            {d.toLocaleDateString(locale, { day: "numeric" })}
                            {open && !on && <span aria-hidden className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-grad" />}
                            {today && !on && <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-inset ring-accent/50" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. times */}
                  <div className="p-5 sm:p-7 border-t lg:border-t-0 lg:border-e border-line min-h-[18rem]">
                    {!selectedKey ? (
                      <div className="h-full grid place-items-center text-center text-sm text-faint">
                        <div>
                          <CalendarCheck size={26} className="mx-auto mb-3 opacity-60" />
                          {pick("Pick a highlighted day to see open times.", "اختار يوم من الأيام المتاحة عشان تشوف المواعيد.")}
                        </div>
                      </div>
                    ) : (
                      <motion.div key={selectedKey} initial={{ opacity: 0, x: isAr ? -12 : 12 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="font-display text-lg">{daySlots[0].toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</p>
                        <p className="mt-1 text-xs text-faint">
                          {daySlots.length} {pick("open times", "ميعاد متاح")}
                        </p>
                        <div className="mt-5 space-y-5 max-h-[24rem] overflow-y-auto pe-1">
                          {periods.map(({ key, label, Icon, items }) => (
                            <div key={key}>
                              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                                <Icon size={13} /> {label}
                              </p>
                              <div className="grid grid-cols-2 gap-2" role="listbox" aria-label={label}>
                                {items.map((t) => {
                                  const on = slot?.getTime() === t.getTime();
                                  return (
                                    <button
                                      key={t.getTime()}
                                      type="button"
                                      role="option"
                                      aria-selected={on}
                                      onClick={() => pickSlot(t)}
                                      className={`rounded-xl py-2.5 text-sm tabular-nums transition-all ${
                                        on ? "bg-grad text-white font-semibold shadow-[0_10px_24px_-10px_var(--accent)]" : "border border-line text-muted hover:text-fg hover:border-accent/60"
                                      }`}
                                    >
                                      {t.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* 3. details */}
                  <form ref={formRef} onSubmit={submit} className="p-5 sm:p-7 border-t lg:border-t-0 border-line scroll-mt-28">
                    <div className={`rounded-2xl p-4 transition-colors ${slot ? "bg-grad text-white" : "border border-dashed border-line"}`}>
                      {slot ? (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-white/75">{pick("Your call", "مكالمتك")}</p>
                            <p className="mt-1 font-semibold leading-snug">{when(slot)}</p>
                          </div>
                          <button type="button" onClick={() => setSlot(null)} aria-label={pick("Change time", "غيّر الميعاد")} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30">
                            <Pencil size={13} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-faint text-center py-1">{pick("Pick a day and time first", "اختار اليوم والساعة الأول")}</p>
                      )}
                    </div>

                    <fieldset disabled={!slot} className="mt-4 space-y-3 transition-opacity disabled:opacity-50">
                      <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={pick("Your name", "اسمك")} aria-label={pick("Your name", "اسمك")} className={field} />
                      <input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={pick("Email", "الإيميل")} aria-label={pick("Email", "الإيميل")} className={`${field} ${isAr ? "text-end" : ""}`} />
                      <input type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={pick("Phone / WhatsApp (optional)", "موبايل / واتساب (اختياري)")} aria-label={pick("Phone", "الموبايل")} className={`${field} ${isAr ? "text-end" : ""}`} />
                      <input value={form.topic} maxLength={120} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={pick("What's it about?", "الموضوع عن إيه؟")} aria-label={pick("Topic", "الموضوع")} className={field} />
                      <textarea rows={2} value={form.note} maxLength={2000} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={pick("Anything I should know (optional)", "أي تفاصيل تحب أعرفها (اختياري)")} aria-label={pick("Notes", "ملاحظات")} className={`${field} resize-none`} />
                    </fieldset>

                    {status === "taken" && <p role="alert" className="mt-3 text-sm text-danger">{pick("Someone just took that time — pick another.", "حد لسه حاجز الميعاد ده — اختار ميعاد تاني.")}</p>}
                    {status === "error" && <p role="alert" className="mt-3 text-sm text-danger">{pick("That didn't go through. Try again.", "الحجز ما اتسجلش. جرب تاني.")}</p>}

                    <button type="submit" disabled={!slot || status === "sending"} className={`${btn.primary} mt-4 w-full disabled:opacity-50 disabled:hover:translate-y-0`}>
                      {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
                      {pick("Confirm booking", "أكّد الحجز")}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-faint">{pick("Free · no payment needed", "مجاني · مفيش أي دفع")}</p>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}
