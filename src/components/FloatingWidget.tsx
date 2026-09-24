import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Bot, X, Send, Sparkles, User, Zap, Terminal } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

type Props = {
  lang?: string;
  isDark?: boolean;
};

export default function FloatingWidget({ lang = "EN", isDark = true }: Props) {
  const isAr = lang?.toUpperCase() === "AR";
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: isAr
        ? "مرحباً بك! أنا مساعد أحمد إسماعيل الذكي. تفضل بطرح سؤالك وسأجيبك فوراً."
        : "Welcome! I'm Ahmed Ismail's AI assistant. Feel free to ask me anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an AI assistant for Ahmed Ismail, a professional Frontend Architect / Developer. 
                  CRITICAL RULE: You MUST reply strictly in the following language: ${isAr ? "Arabic (العربية)" : "English"}. 
                  Answer politely, concisely, and helpfully. User message: "${userMessage}"`,
                },
              ],
            },
          ],
        });
      } catch (err: any) {
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an AI assistant for Ahmed Ismail, a professional Frontend Architect / Developer. 
                  CRITICAL RULE: You MUST reply strictly in the following language: ${isAr ? "Arabic (العربية)" : "English"}. 
                  User message: "${userMessage}"`,
                },
              ],
            },
          ],
        });
      }

      const aiReply = response.text || (isAr ? "عذراً، حدث خطأ في الرد." : "Sorry, an error occurred.");
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: isAr
            ? "الخوادم تشهد ضغطاً حالياً. يمكنك مراسلة أحمد عبر واتساب مباشرة."
            : "Servers are busy. You can message Ahmed directly via WhatsApp.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 ${isAr ? "left-6" : "right-6"} z-50`} dir={isAr ? "rtl" : "ltr"}>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute bottom-20 ${
              isAr ? "left-0" : "right-0"
            } w-[330px] sm:w-[390px] h-[520px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-3xl border ${
              isDark 
                ? "bg-[#090d16]/90 border-indigo-500/30 text-slate-100 shadow-indigo-500/10" 
                : "bg-white/90 border-slate-200 text-slate-800 shadow-slate-300"
            }`}
          >
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? "bg-indigo-950/20 border-indigo-500/20" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Terminal size={20} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#090d16] rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm tracking-wide">Ahmed's AI</h3>
                    <Sparkles size={12} className="text-indigo-400 animate-spin" />
                  </div>
                  <span className="text-[10px] text-indigo-400/80 font-mono tracking-wider uppercase">Online System</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className={`flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin ${isDark ? "bg-transparent" : "bg-slate-50/40"}`}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      msg.sender === "user"
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                        : isDark ? "bg-slate-800 text-indigo-400 border border-indigo-500/20" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {msg.sender === "user" ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div
                    className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20"
                        : isDark
                          ? "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner"
                          : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono pl-2">
                  <Zap size={13} className="animate-bounce text-indigo-400" />
                  <span>{isAr ? "جاري معالجة الرد..." : "Processing response..."}</span>
                </div>
              )}
            </div>

            <div className={`px-4 py-2 border-t flex items-center justify-between text-[11px] ${isDark ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-100/60 border-slate-200"}`}>
              <span className="text-slate-400 font-mono">Need human support?</span>
              <a
                href="https://wa.me/201026377928"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all font-semibold"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            </div>

            <form onSubmit={handleSend} className={`p-3 border-t flex items-center gap-2 ${isDark ? "bg-[#05080f] border-indigo-500/20" : "bg-white border-slate-200"}`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAr ? "اكتب سؤالك هنا..." : "Type your message..."}
                className={`flex-1 text-xs px-4 py-3 rounded-2xl outline-none transition-all ${
                  isDark 
                    ? "bg-slate-900/80 border border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500" 
                    : "bg-slate-100 border border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all shadow-lg shadow-indigo-500/30 cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative group p-4 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center cursor-pointer transition-all border border-white/20"
        aria-label="AI Assistant"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
        </span>

        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </motion.button>

    </div>
  );
}