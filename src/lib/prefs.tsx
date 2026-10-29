import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "EN" | "AR";

type Prefs = {
  lang: Lang;
  setLang: (l: Lang) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  isAr: boolean;
  /** pick the Arabic or English text, falling back to the other one when empty */
  pick: (en?: string | null, ar?: string | null) => string;
  /** site defaults from the dashboard; ignored for anything the visitor already chose */
  applyDefaults: (lang: Lang, theme: "dark" | "light" | "system") => void;
};

const PrefsContext = createContext<Prefs | null>(null);

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: preference just won't persist */
  }
};

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (read("lang") === "AR" ? "AR" : "EN"));
  const [isDark, setIsDarkState] = useState(() => read("theme") !== "light");

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
    document.documentElement.dir = lang === "AR" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg || (isDark ? "#0b0b0c" : "#f6f5f1"));
  }, [isDark]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write("lang", l);
  }, []);
  const setIsDark = useCallback((d: boolean) => {
    setIsDarkState(d);
    write("theme", d ? "dark" : "light");
  }, []);

  const applyDefaults = useCallback((l: Lang, theme: "dark" | "light" | "system") => {
    if (!read("lang")) setLangState(l);
    if (!read("theme")) setIsDarkState(theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark");
  }, []);

  const isAr = lang === "AR";
  const pick = useCallback((en?: string | null, ar?: string | null) => (isAr ? ar || en : en || ar) || "", [isAr]);

  return (
    <PrefsContext.Provider value={{ lang, setLang, isDark, setIsDark, isAr, pick, applyDefaults }}>{children}</PrefsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return ctx;
}
