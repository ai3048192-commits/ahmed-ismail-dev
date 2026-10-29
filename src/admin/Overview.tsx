import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, FolderKanban, Inbox, Palette, Plus, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Message, SiteEvent, Visit } from "../lib/types";
import { Card } from "./ui";
import { timeAgo } from "./format";

const DAYS = 30;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

type Counts = { projects: number; hidden: number; skills: number; experience: number; messages: number; unread: number };

function Stat({ label, value, sub, Icon }: { label: string; value: number | string; sub?: string; Icon: typeof Eye }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-accent-ink">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "صباح الخير" : h < 18 ? "مساء الخير" : "مساء النور";
}

/** one series, so no legend: the card title names it. Hover/focus a bar for its value. */
function VisitsChart({ days }: { days: { date: Date; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.count), 1);
  const top = max <= 4 ? max : Math.ceil(max / 5) * 5; // clean tick
  const label = (d: Date) => d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="relative h-48" dir="ltr">
        {/* recessive gridlines: top, middle, baseline */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-surface ps-1.5 text-[10px] text-faint tabular-nums">{Math.round(top * f)}</span>
          </div>
        ))}
        <div className="absolute inset-0 pe-8 flex items-end gap-[2px]">
          {days.map((d, i) => (
            <div
              key={i}
              tabIndex={0}
              role="img"
              aria-label={`${label(d.date)}: ${d.count} زيارة`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="relative flex-1 h-full flex items-end justify-center outline-none"
            >
              <div
                className={`w-full max-w-6 rounded-t-[4px] transition-opacity ${hover !== null && hover !== i ? "opacity-40" : ""} ${d.count ? "bg-chart" : "bg-line"}`}
                style={{ height: d.count ? `${(d.count / top) * 100}%` : "2px" }}
              />
              {hover === i && (
                <div className="absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs shadow-lg pointer-events-none" dir="rtl">
                  <span className="text-faint">{label(d.date)}</span> · <span className="font-semibold tabular-nums">{d.count}</span> زيارة
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 pe-8 flex justify-between text-[10px] text-faint" dir="ltr">
        <span>{label(days[0].date)}</span>
        <span>النهارده</span>
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-muted hover:text-fg">عرض كجدول</summary>
        <table className="mt-3 w-full max-w-xs">
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date.toISOString()} className="border-b border-line">
                <td className="py-1 text-muted">{label(d.date)}</td>
                <td className="py-1 text-end tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Breakdown({ rows }: { rows: { label: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  if (!rows.length) return <p className="text-sm text-faint">مفيش بيانات لسه.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate" dir="auto">
              {r.label}
            </span>
            <span className="text-muted tabular-nums">
              {r.count} <span className="text-faint text-xs">({Math.round((r.count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-chart" style={{ width: `${(r.count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const tally = (list: string[], top = 5) =>
  Object.entries(list.reduce<Record<string, number>>((acc, k) => ((acc[k] = (acc[k] || 0) + 1), acc), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, count]) => ({ label, count }));

export default function Overview() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [recent, setRecent] = useState<Message[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [upcoming, setUpcoming] = useState<number | null>(null);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - (DAYS - 1));
    since.setHours(0, 0, 0, 0);
    const base = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
    const count = (table: string, filter?: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
      const q = base(table);
      return (filter ? filter(q) : q).then((r) => r.count || 0);
    };

    Promise.all([
      supabase.from("visits").select("*").gte("created_at", since.toISOString()).order("created_at").limit(20000),
      supabase.from("events").select("*").gte("created_at", since.toISOString()).limit(20000),
      supabase.from("bookings").select("id", { count: "exact", head: true }).neq("status", "cancelled").gte("start_at", new Date().toISOString()),
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(5),
      count("projects"),
      count("projects", (q) => q.eq("published", false)),
      count("skills"),
      count("experience"),
      count("messages"),
      count("messages", (q) => q.eq("is_read", false)),
    ]).then(([v, ev, bk, m, projects, hidden, skills, experience, messages, unread]) => {
      setVisits((v.data as Visit[]) || []);
      setEvents((ev.data as SiteEvent[]) || []);
      setUpcoming(bk.error ? null : bk.count || 0);
      setRecent((m.data as Message[]) || []);
      setCounts({ projects, hidden, skills, experience, messages, unread });
    });
  }, []);

  const days = useMemo(() => {
    const byDay: Record<string, number> = {};
    visits.forEach((v) => {
      const k = dayKey(new Date(v.created_at));
      byDay[k] = (byDay[k] || 0) + 1;
    });
    return Array.from({ length: DAYS }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (DAYS - 1 - i));
      return { date, count: byDay[dayKey(date)] || 0 };
    });
  }, [visits]);

  const today = days[DAYS - 1].count;
  const week = days.slice(-7).reduce((s, d) => s + d.count, 0);
  const prevWeek = days.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const trend = prevWeek ? Math.round(((week - prevWeek) / prevWeek) * 100) : null;

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 mb-4">
        <div aria-hidden className="absolute -top-24 -end-24 h-64 w-64 rounded-full bg-accent opacity-25 blur-[80px]" />
        <p className="relative font-mono text-[11px] uppercase text-faint">
          {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="relative mt-3 font-display text-3xl sm:text-4xl tracking-tight">
          {greeting()}
        </h1>
        <p className="relative mt-2 text-sm text-muted">ده ملخص موقعك النهارده.</p>
        <div className="relative mt-6 flex flex-wrap gap-2">
          <Link to="/admin/projects" className="inline-flex items-center gap-2 rounded-pill bg-accent text-accent-fg px-4 py-2 text-xs font-semibold">
            <Plus size={14} /> مشروع جديد
          </Link>
          <Link to="/admin/messages" className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-xs hover:bg-surface-2">
            <Inbox size={14} /> الرسائل
          </Link>
          <Link to="/admin/design" className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-xs hover:bg-surface-2">
            <Palette size={14} /> شكل الموقع
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="زيارات النهارده" value={today} Icon={Eye} />
        <Stat label="زيارات آخر 7 أيام" value={week} Icon={TrendingUp} sub={trend === null ? undefined : `${trend >= 0 ? "+" : ""}${trend}% عن الأسبوع اللي قبله`} />
        <Stat label="رسائل جديدة" value={counts?.unread ?? "—"} Icon={Inbox} sub={counts ? `من ${counts.messages} رسالة` : undefined} />
        <Stat label="المشاريع" value={counts?.projects ?? "—"} Icon={FolderKanban} sub={counts?.hidden ? `${counts.hidden} مخفي` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`الزيارات في آخر ${DAYS} يوم`} className="lg:col-span-2">
          <VisitsChart days={days} />
        </Card>

        <Card
          title="آخر الرسائل"
          action={
            <Link to="/admin/messages" className="text-xs text-muted hover:text-fg inline-flex items-center gap-1">
              الكل <ArrowLeft size={12} />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-faint">مفيش رسائل لسه.</p>
          ) : (
            <ul className="space-y-1 -mx-2">
              {recent.map((m) => (
                <li key={m.id}>
                  <Link to={`/admin/messages?id=${m.id}`} className="flex gap-3 rounded-xl p-2 hover:bg-surface-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.is_read ? "bg-transparent" : "bg-chart"}`} aria-label={m.is_read ? undefined : "جديدة"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2 text-sm">
                        <span className={`truncate ${m.is_read ? "" : "font-semibold"}`}>{m.name}</span>
                        <span className="text-[11px] text-faint shrink-0">{timeAgo(m.created_at)}</span>
                      </span>
                      <span dir="auto" className="block text-xs text-muted truncate text-start">{m.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="الزوار جايين منين">
          <Breakdown rows={tally(visits.map((v) => v.referrer || "دخول مباشر"))} />
        </Card>
        <Card title="نوع الجهاز">
          <Breakdown rows={tally(visits.map((v) => (v.device === "mobile" ? "موبايل" : v.device === "desktop" ? "كمبيوتر" : "غير معروف")))} />
        </Card>
        <Card title="لغة التصفح">
          <Breakdown rows={tally(visits.map((v) => (v.lang === "AR" ? "عربي" : v.lang === "EN" ? "إنجليزي" : "غير معروف")))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={`تفاعل الزوار (آخر ${DAYS} يوم)`} className="lg:col-span-2">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { k: "cv_download", label: "تحميل الـ CV" },
              { k: "whatsapp_click", label: "ضغطة واتساب" },
              { k: "project_open", label: "فتح مشروع" },
              { k: "booking_made", label: "حجز مكالمة" },
              { k: "project_link", label: "زيارة موقع مشروع" },
              { k: "email_click", label: "ضغطة إيميل" },
              { k: "post_open", label: "قراءة مقال" },
              { k: "chat_open", label: "فتح المساعد" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-surface-2/60 p-3">
                <dt className="text-[11px] text-muted">{x.label}</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">{events.filter((e) => e.type === x.k).length}</dd>
              </div>
            ))}
          </dl>
          {upcoming !== null && (
            <Link to="/admin/bookings" className="mt-4 flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm hover:bg-surface-2">
              <span>مكالمات جاية محجوزة</span>
              <span className="font-display text-xl tabular-nums">{upcoming}</span>
            </Link>
          )}
        </Card>
        <Card title="أكتر المشاريع اتفتحت">
          <Breakdown rows={tally(events.filter((e) => e.type === "project_open").map((e) => e.label))} />
        </Card>
      </div>

      {counts && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <span className="text-muted">المحتوى:</span>
          <Link to="/admin/projects" className="hover:underline">{counts.projects} مشروع</Link>
          <Link to="/admin/skills" className="hover:underline">{counts.skills} مهارة</Link>
          <Link to="/admin/experience" className="hover:underline">{counts.experience} خبرة وشهادة</Link>
        </div>
      )}
    </div>
  );
}
