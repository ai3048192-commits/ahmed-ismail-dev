// Chat assistant. Runs on Supabase Edge Functions so the Gemini key never reaches the browser.
// Deploy:  npx supabase functions deploy chat --no-verify-jwt
// Secret:  npx supabase secrets set GEMINI_API_KEY=...
import { createClient } from "jsr:@supabase/supabase-js@2";

const LIMIT_PER_HOUR = 20;
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Msg = { role: "user" | "model"; text: string };

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return json({ error: "not_configured" }, 503);

  let messages: Msg[] = [];
  let lang = "EN";
  try {
    const body = await req.json();
    lang = body.lang === "AR" ? "AR" : "EN";
    messages = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-12)
      .filter((m: Msg) => (m.role === "user" || m.role === "model") && typeof m.text === "string")
      .map((m: Msg) => ({ role: m.role, text: m.text.slice(0, 1000) }));
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "bad_request" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // rate limit by hashed IP; the raw address is never stored
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const ipHash = await sha256(ip + (Deno.env.get("SUPABASE_URL") || ""));
  const { count } = await db
    .from("chat_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= LIMIT_PER_HOUR) return json({ error: "rate_limited" }, 429);
  await db.from("chat_log").insert({ ip_hash: ipHash });

  const [profile, skills, projects, services, packages, faqs] = await Promise.all([
    db.from("profile").select("*").eq("id", 1).maybeSingle(),
    db.from("skills").select("name_en, category"),
    db.from("projects").select("name_en, category, url, desc_en").eq("published", true),
    db.from("services").select("title_en, desc_en"),
    db.from("packages").select("name_en, price, period_en, features_en"),
    db.from("faqs").select("q_en, a_en"),
  ]);
  const p = profile.data || {};
  const system = [
    `You are the assistant on ${p.full_name_en}'s portfolio website. ${p.full_name_en} is a ${p.role_en} based in ${p.location_en}.`,
    "Answer visitors' questions about him, his work, skills, services and prices. Keep answers to 2–4 sentences.",
    `If you don't know, say so and suggest WhatsApp (+${String(p.whatsapp || "").replace(/\D/g, "")}), email (${p.email}) or the booking form on the site. Never invent prices, clients or dates.`,
    `Reply in ${lang === "AR" ? "Egyptian Arabic" : "English"} unless the visitor writes in another language.`,
    `Available for work: ${p.available ? "yes" : "not right now"}. Years of experience: ${p.years_experience}.`,
    `About: ${p.hero_desc_en} ${p.about_en}`,
    `Services: ${(services.data || []).map((s) => `${s.title_en} (${s.desc_en})`).join("; ")}`,
    `Packages: ${(packages.data || []).map((x) => `${x.name_en}: ${x.price} ${x.period_en} — ${(x.features_en || []).join(", ")}`).join(" | ") || "ask him directly"}`,
    `Skills: ${(skills.data || []).map((s) => s.name_en.trim()).join(", ")}`,
    `Projects: ${(projects.data || []).map((x) => `${x.name_en} (${x.category}${x.url ? `, ${x.url}` : ""}): ${x.desc_en}`).join(" | ")}`,
    `FAQ: ${(faqs.data || []).map((f) => `Q: ${f.q_en} A: ${f.a_en}`).join(" | ")}`,
    p.chat_context && `Extra notes from him: ${p.chat_context}`,
  ]
    .filter(Boolean)
    .join("\n");

  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: 400 },
      }),
    });
    if (!res.ok) {
      console.warn(model, res.status, await res.text());
      continue;
    }
    const data = await res.json();
    const reply = (data.candidates?.[0]?.content?.parts || []).map((x: { text?: string }) => x.text || "").join("").trim();
    if (reply) return json({ reply });
  }
  return json({ error: "upstream" }, 502);
});
