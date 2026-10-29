import { ColorField, GalleryField, MediaField, NumberField, RangeField, SelectField, TagsField, TextField, Toggle } from "./fields";

/* A form is described as a list of fields; the same renderer drives
   every resource editor and the profile page. */

export type FieldDef = {
  key: string;
  label: string;
  hint?: string;
  /** "en" fields are typed left-to-right */
  lang?: "en" | "ar";
  /** take half the row on wide screens (used for EN/AR pairs) */
  half?: boolean;
  required?: boolean;
  folder?: string;
  accept?: string;
  options?: { value: string; label: string }[];
  /** textarea height */
  rows?: number;
  /** select whose values are stored as numbers */
  numeric?: boolean;
  type: "text" | "textarea" | "url" | "email" | "number" | "range" | "color" | "toggle" | "select" | "tags" | "media" | "gallery";
};

export type FormSection = { title: string; fields: FieldDef[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Values = Record<string, any>;

function Field({ def, value, set }: { def: FieldDef; value: unknown; set: (v: unknown) => void }) {
  const dir = def.lang === "en" || def.type === "url" || def.type === "email" ? "ltr" : def.lang === "ar" ? "rtl" : undefined;
  const common = { label: def.label, hint: def.hint, dir } as const;
  switch (def.type) {
    case "textarea":
      return <TextField {...common} multiline rows={def.rows} value={value as string} onChange={set} />;
    case "number":
      return <NumberField {...common} value={value as number} onChange={set} />;
    case "range":
      return <RangeField {...common} value={value as number} onChange={set} />;
    case "color":
      return <ColorField {...common} value={value as string} onChange={set} />;
    case "toggle":
      return <Toggle {...common} value={value as boolean} onChange={set} />;
    case "select":
      return <SelectField {...common} value={String(value ?? "")} onChange={(v) => set(def.numeric ? Number(v) : v)} options={def.options || []} />;
    case "tags":
      return <TagsField {...common} value={value as string[]} onChange={set} />;
    case "media":
      return <MediaField {...common} value={value as string} onChange={set} folder={def.folder || "misc"} accept={def.accept} />;
    case "gallery":
      return <GalleryField {...common} value={value as string[]} onChange={set} folder={def.folder || "misc"} />;
    default:
      return <TextField {...common} type={def.type === "text" ? "text" : def.type} required={def.required} value={value as string} onChange={set} />;
  }
}

export function FormSections({ sections, values, onChange }: { sections: FormSection[]; values: Values; onChange: (key: string, v: unknown) => void }) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <fieldset key={s.title}>
          <legend className="text-xs font-semibold text-faint uppercase mb-4">{s.title}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.fields.map((f) => (
              <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                <Field def={f} value={values[f.key]} set={(v) => onChange(f.key, v)} />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
