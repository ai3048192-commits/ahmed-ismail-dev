import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Cpu,
  FolderGit2,
  Medal,
  Languages,
  Sparkles,
  Terminal,
  ChevronDown,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

type HeaderProps = {
  currentLang?: string;
  setCurrentLang?: (lang: string) => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
};

export default function Header({
  currentLang = "EN",
  setCurrentLang,
  isDark,
  setIsDark,
}: HeaderProps) {
  const [active, setActive] = useState("Home");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const navHeight = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const navItems = [
    {
      name: "Home",
      arName: currentLang === "AR" ? "الرئيسية" : "Home",
      icon: Home,
      href: "#home",
    },
    {
      name: "Skills",
      arName: currentLang === "AR" ? "المهارات" : "Skills",
      icon: Cpu,
      href: "#skills",
    },
    {
      name: "Projects",
      arName: currentLang === "AR" ? "المشاريع" : "Projects",
      icon: FolderGit2,
      href: "#projects",
    },
    {
      name: "Experience",
      arName: currentLang === "AR" ? "الخبرات" : "Experience",
      icon: Medal,
      href: "#experience",
    },
  ];

  return (
    <>
      {/* ================= ULTRA-MODERN FLOATING ISLAND HEADER (DESKTOP) ================= */}
      <div className="hidden lg:flex justify-center sticky top-5 z-50 px-6">
        <header
          className={`
            w-full max-w-5xl
            backdrop-blur-2xl
            rounded-full
            px-5 py-2.5
            flex items-center justify-between
            relative
            transition-all duration-500
            ${
              isDark
                ? "bg-[#090D16]/85 border border-cyan-500/25 shadow-[0_0_35px_rgba(6,182,212,0.12)]"
                : "bg-white/85 border border-slate-200/90 shadow-[0_15px_35px_rgba(0,0,0,0.06)]"
            }
          `}
        >
          {/* Neon Top Edge Highlight */}
          <div className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />

          {/* BRAND / LOGO - Minimalist Tech Capsule */}
          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className={`p-2 rounded-full transition-all duration-300 ${
              isDark 
                ? "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/25 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]" 
                : "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100"
            }`}>
              <Terminal size={16} className="transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <div className="flex items-center gap-2">
              <span className={` font-bold text-xs tracking-wider ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {currentLang === "AR" ? "أحمد إسماعيل" : "AHMED.DEV"}
              </span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
            </div>
          </div>

          {/* CAPSULE NAVIGATION BAR */}
          <nav className={`flex items-center gap-1 p-1 rounded-full border ${
            isDark ? "bg-[#04060B]/70 border-slate-800/90" : "bg-slate-100/90 border-slate-200"
          }`}>
            {navItems.map((item) => {
              const isActive = active === item.name;
              const IconComp = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={(e) => {
                    setActive(item.name);
                    scrollToSection(e, item.href);
                  }}
                  className={`
                    relative px-4 py-2 rounded-full text-xs font-medium
                    flex items-center gap-2 transition-all duration-300 cursor-pointer
                    ${
                      isActive
                        ? isDark ? "text-cyan-300 font-semibold" : "text-cyan-900 font-semibold"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pillActiveTab"
                      className={`absolute inset-0 rounded-full border ${
                        isDark
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                          : "bg-white border-cyan-500/40 shadow-sm"
                      }`}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <IconComp size={14} className={`relative z-10 transition-colors ${isActive ? "text-cyan-400" : ""}`} />
                  <span className="relative z-10">{item.arName}</span>
                </button>
              );
            })}
          </nav>

          {/* ACTIONS (Theme & Language Futuristic Pods) */}
          <div className="flex items-center gap-2 pr-1">
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />

            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-full 
                  border font-mono text-xs font-semibold
                  transition-all duration-300 cursor-pointer
                  ${
                    isDark
                      ? "bg-[#04060B] border-slate-800 text-cyan-400 hover:border-cyan-500/60 hover:shadow-[0_0_18px_rgba(6,182,212,0.2)]"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:border-cyan-500/40 hover:bg-slate-200"
                  }
                `}
              >
                <Languages size={14} className="text-cyan-500" />
                <span>{currentLang}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 text-cyan-400 ${isLangMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <>
                    <div onClick={() => setIsLangMenuOpen(false)} className="fixed inset-0 z-40" />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 top-full mt-2 w-36 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-2xl border ${
                        isDark ? "bg-[#090D16] border-slate-800 shadow-black/80" : "bg-white border-slate-200 shadow-xl"
                      }`}
                    >
                      <button
                        onClick={() => { setCurrentLang?.("EN"); setIsLangMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          currentLang === "EN" ? "bg-cyan-500/20 text-cyan-300 font-bold" : isDark ? "text-slate-400 hover:bg-slate-800/60" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>English</span>
                        <span className="text-[10px] opacity-70">EN</span>
                      </button>
                      <button
                        onClick={() => { setCurrentLang?.("AR"); setIsLangMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer mt-1 ${
                          currentLang === "AR" ? "bg-cyan-500/20 text-cyan-300 font-bold" : isDark ? "text-slate-400 hover:bg-slate-800/60" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>العربية</span>
                        <span className="text-[10px] opacity-70">AR</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
      </div>

      {/* ================= MOBILE FLOATING DOCK ================= */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-50">
        <div
          className={`
            backdrop-blur-2xl
            rounded-3xl p-2
            flex items-center justify-between gap-1
            relative
            ${
              isDark
                ? "bg-[#090D16]/90 border border-cyan-500/25 shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
                : "bg-white/95 border border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.1)]"
            }
          `}
        >
          <div className="flex items-center flex-1 justify-around">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = active === item.name;
              return (
                <button
                  key={item.name}
                  onClick={(e) => {
                    setActive(item.name);
                    scrollToSection(e, item.href);
                  }}
                  className={`
                    relative flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all duration-300 cursor-pointer
                    ${isActive ? (isDark ? "text-cyan-300" : "text-cyan-900") : (isDark ? "text-slate-400" : "text-slate-500")}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobilePillTab"
                      className={`absolute inset-0 rounded-2xl border ${
                        isDark ? "bg-cyan-500/20 border-cyan-500/40" : "bg-cyan-50 border-cyan-500/30"
                      }`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <IconComponent size={16} className={`relative z-10 ${isActive ? "text-cyan-400" : ""}`} />
                  <span className="text-[10px] mt-1 relative z-10 font-medium">{item.arName}</span>
                </button>
              );
            })}
          </div>

          <div className={`w-[1px] h-6 mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          <div className="flex items-center gap-1.5 pr-1">
            <div className="scale-90 origin-right">
              <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
            </div>
            <button
              onClick={() => setCurrentLang?.(currentLang === "EN" ? "AR" : "EN")}
              className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl border font-mono text-[10px] cursor-pointer transition-colors ${
                isDark ? "bg-[#04060B] border-slate-800 text-cyan-400" : "bg-slate-100 border-slate-200 text-cyan-700"
              }`}
            >
              <Languages size={13} className="text-cyan-500 mb-0.5" />
              <span className="font-bold">{currentLang}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}