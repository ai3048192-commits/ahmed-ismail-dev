import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const MEDIA_BUCKET = "media";

const MAX_SIDE = 2000;

async function compress(file: File): Promise<File> {
  if (!/^image\/(png|jpe?g|webp|avif)$/i.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.84));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export async function uploadMedia(original: File, folder: string) {
  const file = await compress(original);
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export type EventType = "cv_download" | "whatsapp_click" | "email_click" | "project_open" | "project_link" | "post_open" | "booking_made" | "chat_open";

const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");

export function track(type: EventType, label = "") {
  if (isPreview) return;
  supabase
    .from("events")
    .insert({ type, label: label.slice(0, 200) })
    .then(({ error }) => error && console.warn("track:", error.message));
}

export function pingNotify() {
  supabase.functions.invoke("notify").catch(() => {
    /* optional */
  });
}
