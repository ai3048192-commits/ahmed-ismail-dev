import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

type Props = {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  className?: string;
};

export default function ThemeToggle({ isDark, setIsDark, className = "" }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setIsDark(!isDark)}
      className={`
        p-2.5 rounded-full border cursor-pointer 
        flex items-center justify-center relative overflow-hidden
        transition-all duration-300
        ${
          isDark 
            ? "bg-[#04060B] border-slate-800 text-amber-400 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
            : "bg-slate-100 border-slate-200 text-slate-700 hover:border-cyan-500/40 hover:bg-slate-200"
        } 
        ${className}
      `}
      aria-label="Toggle Theme"
      type="button"
    >
      <div className="relative z-10 flex items-center justify-center">
        {isDark ? (
          <Sun size={15} className="text-amber-400 transition-transform duration-500 rotate-0 hover:rotate-90" />
        ) : (
          <Moon size={15} className="text-cyan-600 transition-transform duration-500 -rotate-12 hover:rotate-12" />
        )}
      </div>
    </motion.button>
  );
}