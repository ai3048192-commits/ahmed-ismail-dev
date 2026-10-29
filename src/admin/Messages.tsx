import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Copy, Mail, MailOpen, Reply, Search, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import type { Message } from "../lib/types";
import { input } from "./fields";
import { EmptyState, PageHeader } from "./ui";
import { MESSAGES_CHANGED, fmtDate, timeAgo } from "./format";

const TOPIC_AR: Record<string, string> = { project: "مشروع ويب", frontend: "شغل واجهات", job: "فرصة شغل", other: "حاجة تانية" };
const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروءة" },
  { key: "starred", label: "المميزة" },
] as const;

const notify = () => window.dispatchEvent(new Event(MESSAGES_CHANGED));

async function fetchMessages() {
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) toast.error(error.message);
  return (data as Message[]) || [];
}

export default function Messages() {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const openId = Number(params.get("id")) || null;

  const load = useCallback(() => fetchMessages().then(setList), []);

  const patch = useCallback(
    async (m: Message, change: Partial<Message>) => {
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, ...change } : x)));
      const { error } = await supabase.from("messages").update(change).eq("id", m.id);
      if (error) {
        toast.error(error.message);
        load();
      }
      notify();
    },
    [load]
  );

  // opening a message marks it read
  const openMessage = (m: Message) => {
    setParams({ id: String(m.id) });
    if (!m.is_read) patch(m, { is_read: true });
  };

  useEffect(() => {
    // read once: a deep link from the overview (?id=) also marks its message read
    const linked = Number(new URLSearchParams(window.location.search).get("id"));
    fetchMessages().then((rows) => {
      setList(rows);
      setLoading(false);
      const m = rows.find((x) => x.id === linked);
      if (m && !m.is_read) patch(m, { is_read: true });
    });
  }, [patch]);

  const open = list.find((m) => m.id === openId);

  const remove = async (m: Message) => {
    if (!confirm(`تمسح رسالة ${m.name}؟`)) return;
    const { error } = await supabase.from("messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setList((l) => l.filter((x) => x.id !== m.id));
    setParams({});
    toast.success("اتمسحت");
    notify();
  };

  const markAllRead = async () => {
    const { error } = await supabase.from("messages").update({ is_read: true }).eq("is_read", false);
    if (error) return toast.error(error.message);
    setList((l) => l.map((x) => ({ ...x, is_read: true })));
    notify();
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (m) =>
        (filter === "all" || (filter === "unread" ? !m.is_read : m.starred)) &&
        (!q || `${m.name} ${m.email} ${m.message}`.toLowerCase().includes(q))
    );
  }, [list, filter, query]);
  const unread = list.filter((m) => !m.is_read).length;

  return (
    <div>
      <PageHeader
        title="الرسائل"
        description="الرسائل اللي الزوار بعتوها من فورم التواصل."
        action={
          unread > 0 && (
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-surface-2">
              <MailOpen size={15} /> علّم الكل كمقروء
            </button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr] items-start">
        <div className={open ? "hidden lg:block" : ""}>
          <div className="relative mb-3">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالاسم أو الإيميل أو النص…" className={`${input} ps-9`} />
          </div>
          <div className="flex gap-1.5 mb-3">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`rounded-lg px-3 py-1.5 text-xs border ${filter === f.key ? "bg-fg text-bg border-fg" : "border-line text-muted hover:text-fg"}`}
              >
                {f.label}
                {f.key === "unread" && unread > 0 && <span className="opacity-60"> {unread}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState text={list.length ? "مفيش رسائل هنا." : "لسه محدش بعت رسالة."} />
          ) : (
            <ul className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
              {visible.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openMessage(m)}
                    className={`w-full text-start flex gap-3 px-4 py-3.5 transition-colors ${m.id === openId ? "bg-surface-2" : "hover:bg-surface-2/60"}`}
                  >
                    <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${m.is_read ? "" : "bg-chart"}`} aria-label={m.is_read ? undefined : "جديدة"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${m.is_read ? "" : "font-semibold"}`}>{m.name}</span>
                        <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-faint">
                          {m.starred && <Star size={12} className="fill-current text-chart" aria-label="مميزة" />}
                          {timeAgo(m.created_at)}
                        </span>
                      </span>
                      <span className="block text-xs text-faint mt-0.5">{TOPIC_AR[m.topic] || m.topic}</span>
                      <span dir="auto" className="block text-sm text-muted truncate mt-1 text-start">{m.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {open ? (
          <article className="rounded-2xl border border-line bg-surface lg:sticky lg:top-8">
            <div className="flex items-center gap-1 border-b border-line px-3 py-2">
              <button type="button" onClick={() => setParams({})} className="lg:hidden p-2 rounded-lg hover:bg-surface-2" aria-label="رجوع">
                <ArrowRight size={17} />
              </button>
              <div className="ms-auto flex items-center gap-1">
                <button type="button" onClick={() => patch(open, { starred: !open.starred })} aria-pressed={open.starred} className="p-2 rounded-lg hover:bg-surface-2" aria-label="تمييز">
                  <Star size={17} className={open.starred ? "fill-current text-chart" : "text-muted"} />
                </button>
                <button type="button" onClick={() => patch(open, { is_read: !open.is_read })} className="p-2 rounded-lg hover:bg-surface-2 text-muted" aria-label={open.is_read ? "علّم كغير مقروءة" : "علّم كمقروءة"}>
                  {open.is_read ? <Mail size={17} /> : <MailOpen size={17} />}
                </button>
                <button type="button" onClick={() => remove(open)} className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-danger" aria-label="حذف">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs text-faint">{TOPIC_AR[open.topic] || open.topic}</p>
              <h2 className="mt-1 text-xl font-semibold">{open.name}</h2>
              <p className="mt-1 text-sm text-muted flex items-center gap-2" dir="ltr">
                <span className="text-end">{open.email}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(open.email).then(() => toast.success("اتنسخ"))}
                  className="p-1 rounded text-faint hover:text-fg"
                  aria-label="نسخ الإيميل"
                >
                  <Copy size={13} />
                </button>
              </p>
              <p className="mt-1 text-xs text-faint">{fmtDate(open.created_at, true)}</p>
              <p className="mt-6 leading-relaxed whitespace-pre-line" dir="auto">
                {open.message}
              </p>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent("رد على رسالتك")}&body=${encodeURIComponent(`\n\n---\n${open.message}`)}`}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-4 py-2.5 text-sm font-semibold"
              >
                <Reply size={15} /> رد بالإيميل
              </a>
            </div>
          </article>
        ) : (
          <div className="hidden lg:grid place-items-center rounded-2xl border border-dashed border-line min-h-[300px] text-sm text-faint">اختار رسالة عشان تقراها</div>
        )}
      </div>
    </div>
  );
}
