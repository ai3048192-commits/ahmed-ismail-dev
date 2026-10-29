import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Check, Mail, MessageCircle, Settings2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import type { Booking, BookingStatus } from "../lib/types";
import { EmptyState, PageHeader } from "./ui";

const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "مستني تأكيد", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  confirmed: { label: "متأكد", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "ملغي", cls: "bg-surface-2 text-faint border-line" },
};
const FILTERS = [
  { key: "upcoming", label: "الجاية" },
  { key: "pending", label: "مستنية تأكيد" },
  { key: "past", label: "اللي فاتت" },
  { key: "all", label: "الكل" },
] as const;

const gcal = (b: Booking) => {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(b.start_at);
  const end = new Date(start.getTime() + b.duration_min * 60000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `مكالمة مع ${b.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [b.topic, b.note, b.email, b.phone].filter(Boolean).join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
};

async function fetchBookings() {
  const { data, error } = await supabase.from("bookings").select("*").order("start_at");
  if (error) toast.error(`${error.message} — شغّلت ملف supabase/features.sql؟`);
  return (data as Booking[]) || [];
}

export default function Bookings() {
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("upcoming");
  const load = useCallback(() => fetchBookings().then(setList), []);

  useEffect(() => {
    fetchBookings().then((rows) => {
      setList(rows);
      setLoading(false);
    });
  }, []);

  const [now] = useState(() => Date.now());
  const visible = useMemo(
    () =>
      list.filter((b) => {
        const t = new Date(b.start_at).getTime();
        if (filter === "upcoming") return t >= now && b.status !== "cancelled";
        if (filter === "pending") return b.status === "pending" && t >= now;
        if (filter === "past") return t < now;
        return true;
      }),
    [list, filter, now]
  );
  const pending = list.filter((b) => b.status === "pending" && new Date(b.start_at).getTime() >= now).length;

  const setStatus = async (b: Booking, status: BookingStatus) => {
    setList((l) => l.map((x) => (x.id === b.id ? { ...x, status } : x)));
    const { error } = await supabase.from("bookings").update({ status }).eq("id", b.id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success(status === "confirmed" ? "اتأكد — ابعتله رسالة" : "اتلغى والميعاد بقى فاضي");
  };

  const remove = async (b: Booking) => {
    if (!confirm(`تمسح حجز ${b.name}؟`)) return;
    const { error } = await supabase.from("bookings").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    setList((l) => l.filter((x) => x.id !== b.id));
  };

  // group by day for a calendar-like read
  const groups = useMemo(() => {
    const m = new Map<string, Booking[]>();
    visible.forEach((b) => {
      const k = new Date(b.start_at).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
      m.set(k, [...(m.get(k) || []), b]);
    });
    return [...m];
  }, [visible]);

  return (
    <div>
      <PageHeader
        title="الحجوزات"
        description="مكالمات الزوار اللي حجزوها من الموقع. المواعيد ظاهرة بتوقيت جهازك."
        action={
          <Link to="/admin/design?tab=booking" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-surface-2">
            <Settings2 size={15} /> مواعيدي المتاحة
          </Link>
        }
      />
      <div className="flex flex-wrap gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-lg px-3 py-1.5 text-xs border ${filter === f.key ? "bg-fg text-bg border-fg" : "border-line text-muted hover:text-fg"}`}
          >
            {f.label}
            {f.key === "pending" && pending > 0 && <span className="opacity-60"> {pending}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState text={list.length ? "مفيش حجوزات هنا." : "لسه محدش حجز. قسم الحجز ظاهر في الموقع لو مفعّل من «شكل الموقع»."} />
      ) : (
        <div className="space-y-8">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h2 className="text-sm font-semibold text-muted mb-3">{day}</h2>
              <ul className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                {items.map((b) => {
                  const start = new Date(b.start_at);
                  return (
                    <li key={b.id} className={`p-4 sm:p-5 grid gap-4 sm:grid-cols-[110px_1fr_auto] sm:items-start ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                      <div>
                        <p className="font-display text-2xl tabular-nums">{start.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}</p>
                        <p className="text-xs text-faint">{b.duration_min} دقيقة</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{b.name}</p>
                          <span className={`rounded-pill border px-2 py-0.5 text-[11px] ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted" dir="ltr">
                          <span className="block text-end sm:text-start">{[b.email, b.phone].filter(Boolean).join(" · ")}</span>
                        </p>
                        {b.topic && <p className="mt-2 text-sm">{b.topic}</p>}
                        {b.note && <p className="mt-1 text-sm text-muted whitespace-pre-line" dir="auto">{b.note}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        {b.status === "pending" && (
                          <button type="button" onClick={() => setStatus(b, "confirmed")} className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-fg px-3 py-1.5 text-xs font-semibold">
                            <Check size={14} /> تأكيد
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button type="button" onClick={() => setStatus(b, "cancelled")} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-surface-2">
                            <X size={14} /> إلغاء
                          </button>
                        )}
                        <a href={`mailto:${b.email}?subject=${encodeURIComponent("بخصوص مكالمتنا")}`} className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2" aria-label="إيميل" title="إيميل">
                          <Mail size={15} />
                        </a>
                        {b.phone && (
                          <a href={`https://wa.me/${b.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2" aria-label="واتساب" title="واتساب">
                            <MessageCircle size={15} />
                          </a>
                        )}
                        <a href={gcal(b)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2" aria-label="إضافة لجوجل كالندر" title="إضافة لجوجل كالندر">
                          <CalendarPlus size={15} />
                        </a>
                        <button type="button" onClick={() => remove(b)} className="p-2 rounded-lg text-muted hover:text-danger hover:bg-surface-2" aria-label="حذف" title="حذف">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
