// Sends new contact messages and bookings to Telegram and/or email, once each.
// The site pings this right after a visitor submits; it only ever sends rows
// whose notified_at is still empty, so calling it repeatedly can't spam you.
// Deploy:  npx supabase functions deploy notify --no-verify-jwt
// Secrets (set whichever channels you want):
//   npx supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
//   npx supabase secrets set RESEND_API_KEY=... NOTIFY_EMAIL=you@example.com RESEND_FROM="Portfolio <onboarding@resend.dev>"
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID");
const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL");
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "Portfolio <onboarding@resend.dev>";
const TZ = Deno.env.get("NOTIFY_TIMEZONE") || "Africa/Cairo";

async function telegram(html: string) {
  if (!TG_TOKEN || !TG_CHAT) return null;
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!r.ok) console.warn("telegram", r.status, await r.text());
  return r.ok;
}

async function email(subject: string, text: string, replyTo: string) {
  if (!RESEND_KEY || !NOTIFY_EMAIL) return null;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: RESEND_FROM, to: [NOTIFY_EMAIL], subject, text, reply_to: replyTo }),
  });
  if (!r.ok) console.warn("resend", r.status, await r.text());
  return r.ok;
}

/** true when every configured channel accepted it (and at least one is configured) */
async function send(subject: string, html: string, text: string, replyTo: string) {
  const results = (await Promise.all([telegram(html), email(subject, text, replyTo)])).filter((x) => x !== null);
  return results.length > 0 && results.every(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!TG_TOKEN && !RESEND_KEY) return json({ error: "no channel configured" }, 503);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let sent = 0;

  const { data: messages } = await db.from("messages").select("*").is("notified_at", null).order("created_at").limit(10);
  for (const m of messages || []) {
    const ok = await send(
      `New message from ${m.name}`,
      `📩 <b>رسالة جديدة</b>\n<b>${esc(m.name)}</b> — ${esc(m.email)}\nالموضوع: ${esc(m.topic)}\n\n${esc(m.message)}`,
      `New message from ${m.name} <${m.email}>\nTopic: ${m.topic}\n\n${m.message}`,
      m.email
    );
    if (ok) {
      await db.from("messages").update({ notified_at: new Date().toISOString() }).eq("id", m.id).is("notified_at", null);
      sent++;
    }
  }

  const { data: bookings } = await db.from("bookings").select("*").is("notified_at", null).order("created_at").limit(10);
  for (const b of bookings || []) {
    const when = new Date(b.start_at).toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "short", timeZone: TZ });
    const ok = await send(
      `New booking: ${b.name}`,
      `📅 <b>حجز جديد</b>\n<b>${esc(b.name)}</b> — ${esc(b.email)}${b.phone ? ` — ${esc(b.phone)}` : ""}\nالميعاد: ${esc(when)} (${b.duration_min} دقيقة)\n${b.topic ? `الموضوع: ${esc(b.topic)}\n` : ""}${b.note ? `\n${esc(b.note)}` : ""}`,
      `New booking from ${b.name} <${b.email}> ${b.phone}\nWhen: ${when} (${b.duration_min} min)\nTopic: ${b.topic}\n\n${b.note}`,
      b.email
    );
    if (ok) {
      await db.from("bookings").update({ notified_at: new Date().toISOString() }).eq("id", b.id).is("notified_at", null);
      sent++;
    }
  }

  return json({ sent });
});
