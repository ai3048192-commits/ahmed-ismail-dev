import { useId, useRef, useState, type ReactNode } from "react";
import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadMedia } from "../lib/supabase";

export const input =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-faint outline-none transition-colors focus:border-chart";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {children}
      </label>
      {hint && <p className="text-xs text-faint mt-0.5">{hint}</p>}
    </div>
  );
}

type Base = { label: string; hint?: string; dir?: "ltr" | "rtl" };

export function TextField({ label, hint, dir, value, onChange, multiline, rows = 4, type = "text", required }: Base & {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {multiline ? (
        <textarea id={id} dir={dir} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${input} resize-y leading-relaxed`} />
      ) : (
        <input id={id} dir={dir} type={type} required={required} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={input} />
      )}
    </div>
  );
}

export function NumberField({ label, hint, value, onChange, min, max }: Base & { value: number | null; onChange: (v: number | null) => void; min?: number; max?: number }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type="number"
        dir="ltr"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={input}
      />
    </div>
  );
}

export function RangeField({ label, value, onChange }: Base & { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>
        {label} <span className="font-mono text-faint">{value ?? 0}%</span>
      </Label>
      <input id={id} type="range" min={0} max={100} step={5} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--chart)]" />
    </div>
  );
}

export function Toggle({ label, hint, value, onChange }: Base & { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-line bg-bg px-4 py-3 cursor-pointer">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-faint mt-0.5">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-surface-2 border border-line transition-colors peer-checked:bg-chart peer-focus-visible:outline-2 peer-focus-visible:outline-chart" />
        <span className="absolute top-1 start-1 h-4 w-4 rounded-full bg-white shadow transition-all peer-checked:start-6" />
      </span>
    </label>
  );
}

export function SelectField({ label, hint, value, onChange, options }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  const known = options.some((o) => o.value === value);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={input}>
        {!known && value && <option value={value}>{value}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ColorField({ label, value, onChange }: Base & { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#65a30d"} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded-lg border border-line bg-bg p-1 cursor-pointer" />
        <input id={id} dir="ltr" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${input} font-mono`} />
      </div>
    </div>
  );
}

export function TagsField({ label, hint, dir, value, onChange }: Base & { value: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const list = value || [];
  const add = () => {
    const parts = draft
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter((s) => s && !list.includes(s));
    if (parts.length) onChange([...list, ...parts]);
    setDraft("");
  };
  return (
    <div>
      <Label htmlFor={id} hint={hint || "اكتب واضغط Enter أو فاصلة"}>
        {label}
      </Label>
      <div className={`${input} flex flex-wrap gap-1.5 !py-2`}>
        {list.map((t, i) => (
          <span key={t + i} dir={dir} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 ps-2.5 pe-1 py-1 text-xs">
            {t}
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={`حذف ${t}`} className="rounded p-0.5 hover:bg-line">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          dir={dir}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && list.length) onChange(list.slice(0, -1));
          }}
          onBlur={add}
          className="flex-1 min-w-[8rem] bg-transparent outline-none py-1"
        />
      </div>
    </div>
  );
}

function useUpload(folder: string) {
  const [busy, setBusy] = useState(false);
  const upload = async (files: File[]) => {
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name}: الحجم أكبر من 10MB`);
          continue;
        }
        urls.push(await uploadMedia(f, folder));
      }
      if (urls.length) toast.success(urls.length > 1 ? `اترفع ${urls.length} ملفات` : "اترفع الملف");
      return urls;
    } catch (err) {
      toast.error(`الرفع فشل: ${(err as Error).message}`);
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { busy, upload };
}

/** a URL that can be pasted or uploaded to the media bucket */
export function MediaField({ label, hint, value, onChange, folder, accept = "image/*" }: Base & { value: string; onChange: (v: string) => void; folder: string; accept?: string }) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, upload } = useUpload(folder);
  const isImage = accept.startsWith("image");
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div className="flex gap-3 items-start">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 grid place-items-center text-faint">
          {value && isImage ? <img src={value} alt="" className="h-full w-full object-cover" /> : isImage ? <ImagePlus size={20} /> : <FileText size={20} />}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <input id={id} dir="ltr" value={value ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} className={input} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-60">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {busy ? "جاري الرفع…" : "ارفع ملف"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-danger hover:bg-surface-2">
                <X size={13} /> شيل
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files || [])];
          e.target.value = "";
          const [url] = await upload(files);
          if (url) onChange(url);
        }}
      />
    </div>
  );
}

export function GalleryField({ label, hint, value, onChange, folder }: Base & { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, upload } = useUpload(folder);
  const list = value || [];
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {list.map((src, i) => (
          <div key={src + i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-2">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="حذف الصورة" className="absolute top-1 end-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white">
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="aspect-[4/3] rounded-xl border border-dashed border-line grid place-items-center text-faint hover:text-fg hover:bg-surface-2">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files || [])];
          e.target.value = "";
          const urls = await upload(files);
          if (urls.length) onChange([...list, ...urls]);
        }}
      />
    </div>
  );
}
