import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { supabase, track } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { waLink } from "./useSiteData";

type Msg = { role: "user" | "model"; text: string };

/** talks to the `chat` edge function; the Gemini key lives on the server */
export default function ChatWidget({ profile }: { profile: Profile }) {
  const { pick, lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  if (!profile.chat_enabled) return null;

  const send = async (text: string) => {
    text = text.trim();
    if (!text || loading) return;
    const history: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(history);
    setInput("");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ reply?: string }>("chat", { body: { messages: history.slice(-12), lang } });
    let reply = data?.reply;
    if (!reply) {
      const status = (error as { context?: Response } | null)?.context?.status;
      reply =
        status === 429
          ? pick("You've reached the message limit for now. Message Ahmed on WhatsApp instead.", "وصلت للحد المسموح دلوقتي. كلم أحمد واتساب على طول.")
          : pick("I can't answer right now. You can message Ahmed on WhatsApp directly.", "مش قادر أرد دلوقتي. تقدر تكلم أحمد واتساب على طول.");
    }
    setMsgs((m) => [...m, { role: "model", text: reply! }]);
    setLoading(false);
  };

  const suggestions = [
    pick("Is Ahmed available for a project?", "أحمد متاح لمشروع؟"),
    pick("How much does a website cost?", "الموقع بيتكلف كام؟"),
    pick("Show me his dashboard projects", "وريني مشاريع لوحات التحكم"),
  ];

  return (
    <div className="fixed bottom-5 end-5 z-[60]">
      {open && (
          <div
            role="dialog"
            aria-label={pick("Chat assistant", "المساعد")}
            className="absolute bottom-16 end-0 w-[min(380px,calc(100vw-2.5rem))] h-[min(540px,calc(100vh-7rem))] flex flex-col rounded-3xl border border-line bg-surface shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)] overflow-hidden animate-[sheet-in_.25s_cubic-bezier(.22,1,.36,1)]"
          >
            <div className="relative flex items-center gap-3 px-5 py-4 border-b border-line">
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-fg">
                <Bot size={18} />
              </span>
              <div className="relative flex-1 min-w-0">
                <p className="text-sm font-semibold">{pick("Ask about Ahmed", "اسأل عن أحمد")}</p>
                <p className="text-xs text-faint flex items-center gap-1">
                  <Sparkles size={11} /> {pick("AI answers from this site's content", "ردود ذكاء اصطناعي من محتوى الموقع")}
                </p>
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
              {msgs.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted mb-3">{pick("Hi! Ask me anything about Ahmed's work.", "أهلاً! اسألني أي حاجة عن شغل أحمد.")}</p>
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="block w-full text-start rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm text-muted hover:text-fg hover:border-fg/30">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p dir="auto" className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${m.role === "user" ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`}>
                    {m.text}
                  </p>
                </div>
              ))}
              {loading && (
                <p className="flex items-center gap-2 text-xs text-faint">
                  <Loader2 size={14} className="animate-spin" /> {pick("Thinking…", "بيفكر…")}
                </p>
              )}
            </div>

            {profile.whatsapp && (
              <a
                href={waLink(profile.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", "chat")}
                className="flex items-center justify-center gap-2 border-t border-line py-2 text-xs text-muted hover:text-fg"
              >
                <MessageCircle size={13} /> {pick("Talk to Ahmed on WhatsApp", "كلم أحمد واتساب")}
              </a>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder={pick("Type a question…", "اكتب سؤالك…")}
                aria-label={pick("Your question", "سؤالك")}
                className="flex-1 min-w-0 rounded-pill bg-bg border border-line px-4 py-2.5 text-sm outline-none focus:border-fg/40"
              />
              <button type="submit" disabled={loading || !input.trim()} aria-label={pick("Send", "إرسال")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-50">
                <Send size={16} className="rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        )}

      <button
        type="button"
        onClick={() => {
          if (!open) track("chat_open");
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label={pick("Chat assistant", "المساعد")}
        className="grid h-14 w-14 place-items-center rounded-full bg-fg text-bg shadow-[0_14px_40px_-12px_rgb(0_0_0/0.5)] transition-[transform,background-color] hover:scale-105 hover:bg-accent hover:text-accent-fg"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
