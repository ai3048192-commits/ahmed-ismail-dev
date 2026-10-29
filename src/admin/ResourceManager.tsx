import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Copy, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { FormSections } from "./form";
import { input } from "./fields";
import type { ResourceConfig, Row } from "./resources";
import { PageHeader, EmptyState } from "./ui";

const READONLY = ["id", "created_at", "updated_at"];

async function fetchRows(table: string) {
  const { data, error } = await supabase.from(table).select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) toast.error(error.message);
  return (data as Row[]) || [];
}

/** render with key={config.table} so switching tables starts from a clean state */
export default function ResourceManager({ config }: { config: ResourceConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      fetchRows(config.table).then((list) => {
        setRows(list);
        setLoading(false);
      }),
    [config.table]
  );

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!group || r[config.groupBy!.key] === group) &&
        (!q || Object.values(r).some((v) => (Array.isArray(v) ? v.join(" ") : String(v ?? "")).toLowerCase().includes(q)))
    );
  }, [rows, query, group, config.groupBy]);

  const save = async () => {
    if (!editing) return;
    const required = config.sections.flatMap((s) => s.fields).filter((f) => f.required && !String(editing[f.key] ?? "").trim());
    if (required.length) {
      toast.error(`لازم تملى: ${required.map((f) => f.label).join("، ")}`);
      return;
    }
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(editing).filter(([k]) => !READONLY.includes(k)));
    const { error } = editing.id
      ? await supabase.from(config.table).update(payload).eq("id", editing.id)
      : await supabase.from(config.table).insert({ ...payload, sort_order: rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0 });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing.id ? "اتحفظ" : `اتضاف ${config.singular} جديد`);
    setEditing(null);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`متأكد إنك عايز تمسح "${config.primary(r)}"؟ مفيش رجوع.`)) return;
    const { error } = await supabase.from(config.table).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("اتمسح");
    setRows((list) => list.filter((x) => x.id !== r.id));
  };

  const flip = async (r: Row, key: string) => {
    setRows((list) => list.map((x) => (x.id === r.id ? { ...x, [key]: !x[key] } : x)));
    const { error } = await supabase.from(config.table).update({ [key]: !r[key] }).eq("id", r.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  // swap with the neighbour, then write the new order for the whole list
  const move = async (r: Row, dir: -1 | 1) => {
    const i = rows.findIndex((x) => x.id === r.id);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    const renumbered = next.map((x, k) => ({ ...x, sort_order: k }));
    setRows(renumbered);
    const changed = renumbered.filter((x, k) => rows[k]?.id !== x.id || rows[k]?.sort_order !== k);
    const results = await Promise.all(changed.map((x) => supabase.from(config.table).update({ sort_order: x.sort_order }).eq("id", x.id)));
    const failed = results.find((res) => res.error);
    if (failed?.error) {
      toast.error(failed.error.message);
      load();
    }
  };

  const duplicate = (r: Row) => {
    const copy: Partial<Row> = { ...r };
    READONLY.forEach((k) => delete copy[k]);
    for (const k of ["name_en", "title_en", "name"]) if (typeof copy[k] === "string") copy[k] = `${copy[k]} (copy)`;
    setEditing(copy);
  };

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <button type="button" onClick={() => setEditing({ ...config.defaults })} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-4 py-2.5 text-sm font-semibold">
            <Plus size={16} /> إضافة {config.singular}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث…" className={`${input} ps-9`} />
        </div>
        {config.groupBy && (
          <div className="flex flex-wrap gap-1.5">
            {[{ value: "", label: "الكل" }, ...config.groupBy.options].map((o) => {
              const count = o.value ? rows.filter((r) => r[config.groupBy!.key] === o.value).length : rows.length;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setGroup(o.value)}
                  aria-pressed={group === o.value}
                  className={`rounded-lg px-3 py-1.5 text-xs border ${group === o.value ? "bg-fg text-bg border-fg" : "border-line text-muted hover:text-fg"}`}
                >
                  {o.label} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState text={rows.length ? "مفيش نتايج للبحث ده." : `لسه مفيش ${config.title}. دوس "إضافة" وابدأ.`} />
      ) : (
        <ul className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
          {visible.map((r) => {
            const idx = rows.findIndex((x) => x.id === r.id);
            const reorderable = !query && !group;
            return (
              <li key={r.id} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-surface-2/60">
                {reorderable && (
                  <div className="flex flex-col">
                    <button type="button" disabled={idx === 0} onClick={() => move(r, -1)} aria-label="لفوق" className="p-0.5 text-faint hover:text-fg disabled:opacity-25">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" disabled={idx === rows.length - 1} onClick={() => move(r, 1)} aria-label="لتحت" className="p-0.5 text-faint hover:text-fg disabled:opacity-25">
                      <ArrowDown size={14} />
                    </button>
                  </div>
                )}
                {config.image && (
                  <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2 border border-line">
                    {config.image(r) && <img src={config.image(r)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                )}
                {config.color && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: config.color(r) }} aria-hidden />}
                <button type="button" onClick={() => setEditing({ ...r })} className="flex-1 min-w-0 text-start">
                  <p className="font-medium truncate">{config.primary(r)}</p>
                  <p className="text-xs text-faint truncate mt-0.5">{config.secondary(r)}</p>
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                  {config.flags?.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => flip(r, f.key)}
                      className={`rounded-lg px-2.5 py-1 text-xs border ${r[f.key] ? "border-chart/40 bg-chart/15 text-fg" : "border-line text-faint"}`}
                    >
                      {r[f.key] ? f.on : f.off}
                    </button>
                  ))}
                </div>
                <div className="flex items-center">
                  <button type="button" onClick={() => setEditing({ ...r })} aria-label="تعديل" className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2">
                    <Pencil size={15} />
                  </button>
                  <button type="button" onClick={() => duplicate(r)} aria-label="نسخ" className="hidden sm:block p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2">
                    <Copy size={15} />
                  </button>
                  <button type="button" onClick={() => remove(r)} aria-label="حذف" className="p-2 rounded-lg text-muted hover:text-danger hover:bg-surface-2">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setEditing(null)} />
            <motion.form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="relative h-full w-full max-w-2xl bg-surface border-s border-line flex flex-col"
            >
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line">
                <h2 className="font-semibold">{editing.id ? `تعديل ${config.singular}` : `${config.singular} جديد`}</h2>
                <button type="button" onClick={() => setEditing(null)} aria-label="إغلاق" className="p-2 rounded-lg hover:bg-surface-2">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <FormSections sections={config.sections} values={editing} onChange={(k, v) => setEditing((e) => ({ ...e, [k]: v }))} />
              </div>
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-fg">
                  إلغاء
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-fg px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  حفظ
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
