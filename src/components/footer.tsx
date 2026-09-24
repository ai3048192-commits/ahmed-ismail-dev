import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  FileDown,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  Terminal,
  Activity,
} from "lucide-react";
import { supabase } from "../lib/supabase"; 

type Props = {
  lang?: string; 
  isArabic?: boolean; 
  isDark?: boolean;
};

export default function Footer({ lang = "EN", isArabic, isDark = true }: Props) {
  const isAr = isArabic || lang?.toUpperCase() === "AR";

  const [whatsappNumber, setWhatsappNumber] = useState("+201234567890");
  const [cvFileUrl, setCvFileUrl] = useState("/cv.pdf");

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("whatsapp, cv_file")
          .eq("id", 1)
          .single();

        if (error) throw error;

        if (data) {
          if (data.whatsapp) setWhatsappNumber(data.whatsapp);
          if (data.cv_file) setCvFileUrl(data.cv_file);
        }
      } catch (err) {
        console.error("Error fetching footer settings from DB:", err);
      }
    };

    fetchFooterSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const content = {
    EN: {
      rights: "All systems operational. Secured & Scalable.",
      backToTop: "Back to top",
      headline: "Let's build the next digital masterpiece.",
      tagline: "High-performance architecture, immersive UI, and production-ready code.",
      downloadCV: "Download Resume",
      cvSubtitle: "Verified PDF • 2026",
      whatsappLabel: "Direct Chat",
      whatsappSub: "Encrypted WhatsApp Line",
      status: "Online",
      badge: "AVAILABLE FOR HIRE",
      myName: "Ahmed Ismail",
    },
    AR: {
      rights: "جميع الأنظمة تعمل بكفاءة وآمنة تماماً.",
      backToTop: "العودة للأعلى",
      headline: "دعنا نبني تحفتك الرقمية القادمة.",
      tagline: "هندسة برمجية عالية الأداء، واجهات تفاعلية جذابة، وكود جاهز للإنتاج.",
      downloadCV: "تحميل السيرة الذاتية",
      cvSubtitle: "نسخة معتمدة • 2026",
      whatsappLabel: "محادثة مباشرة",
      whatsappSub: "قناة واتساب مشفرة وسريعة",
      status: "متصل الآن",
      badge: "متاح للعمل الحر",
      myName: "أحمد إسماعيل",
    },
  };

  const t = isAr ? content.AR : content.EN;

  const formattedWhatsapp = whatsappNumber.replace(/\D/g, "");
  const finalCvUrl = cvFileUrl.startsWith("http") ? cvFileUrl : `/${cvFileUrl}`;

  return (
    <footer
      dir={isAr ? "rtl" : "ltr"}
      className={`relative overflow-hidden transition-colors duration-500 ${
        isDark 
          ? "bg-[#030712] text-zinc-400 border-t border-slate-800/80" 
          : "bg-slate-900 text-slate-300 border-t border-slate-800"
      }`}
    >
      {/* إضاءات خلفية وبوردر علوي متوهج خفيف */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-12 relative z-10">
        
        {/* بانر التواصل الرئيسي بـ Border جذاب وإضاءة خضراء/زرقاء متناسقة */}
        <div className={`mb-16 p-8 sm:p-10 rounded-3xl relative overflow-hidden backdrop-blur-xl border transition-all ${
          isDark 
            ? "bg-gradient-to-r from-zinc-900/90 via-[#0b1329]/70 to-zinc-900/90 border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
            : "bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border-slate-700 shadow-xl"
        }`}>
          {/* لمسات جمالية في زوايا البانر */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span>{t.badge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                {t.headline}
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl">
                {t.tagline}
              </p>
            </div>

            {/* أزرار العمل (واتساب + السيرة الذاتية) مع تباين ألوان صحيح */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <motion.a
                href={`https://wa.me/${formattedWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all border border-emerald-500/30"
              >
                <MessageCircle size={18} className="text-emerald-100" />
                <span>WhatsApp</span>
              </motion.a>

              <motion.a
                href={finalCvUrl}
                download="CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80 text-sm font-bold shadow-lg transition-all"
              >
                <FileDown size={18} className="text-cyan-400" />
                <span>{t.downloadCV}</span>
              </motion.a>
            </div>
          </div>
        </div>

        {/* قسم الهوية ومعلومات الاتصال الإضافية */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80 items-center">
          
          <div className="md:col-span-7 text-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                <Terminal size={20} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-wide">
                {t.myName}
              </h3>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              {t.tagline}
            </p>
          </div>

          <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-3">
            {/* حالة النظام مع لون أخباري مميز */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-zinc-300 shadow-sm">
              <Activity size={14} className="text-emerald-400" />
              <span>Status: <strong className="text-emerald-400">{t.status}</strong></span>
            </div>

            {/* زر العودة للقمة بتصميم متناسق */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
              aria-label={t.backToTop}
            >
              <span>{t.backToTop}</span>
              <ArrowUp size={14} className="text-cyan-400" />
            </motion.button>
          </div>

        </div>

        {/* شريط الحقوق السفلي */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <p>© {new Date().getFullYear()} {t.myName}. {t.rights}</p>
          
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Engineered with React & Tailwind</span>
          </div>
        </div>

      </div>
    </footer>
  );
}