import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePrefs } from "./prefs";
import { DEFAULT_SETTINGS, fontsHref, mergeSettings, themeCss, type SiteSettings } from "./settings";
import { supabase } from "./supabase";

type Ctx = { settings: SiteSettings; loaded: boolean };
const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, loaded: false });

/** the dashboard's live preview iframe receives unsaved settings through this message */
export const PREVIEW_MESSAGE = "site-settings-preview";

function upsertHead<T extends HTMLElement>(selector: string, create: () => T) {
  let el = document.head.querySelector<T>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { applyDefaults } = usePrefs();
  const [state, setState] = useState<Ctx>({ settings: DEFAULT_SETTINGS, loaded: false });

  useEffect(() => {
    let alive = true;
    supabase
      .from("site_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle<{ data: Partial<SiteSettings> }>()
      .then(({ data, error }) => {
        if (error) console.warn("Site settings:", error.message);
        if (!alive) return;
        const settings = mergeSettings(data?.data);
        setState({ settings, loaded: true });
        applyDefaults(settings.default_lang, settings.default_theme);
      });
    return () => {
      alive = false;
    };
  }, [applyDefaults]);

  // live preview: only accept messages from our own origin, and only inside an iframe
  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return;
      setState({ settings: mergeSettings(e.data.settings), loaded: true });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}-ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const { settings } = state;

  useEffect(() => {
    upsertHead("style#site-theme", () => Object.assign(document.createElement("style"), { id: "site-theme" })).textContent = themeCss(settings);
    upsertHead("style#site-custom-css", () => Object.assign(document.createElement("style"), { id: "site-custom-css" })).textContent = settings.custom_css || "";
    const fonts = upsertHead<HTMLLinkElement>("link#site-fonts", () => Object.assign(document.createElement("link"), { id: "site-fonts", rel: "stylesheet" }));
    const href = fontsHref(settings);
    if (fonts.href !== href) fonts.href = href;
    if (settings.favicon_url) {
      upsertHead<HTMLLinkElement>('link[rel="icon"]', () => Object.assign(document.createElement("link"), { rel: "icon" })).href = settings.favicon_url;
    }
    document.documentElement.dataset.motion = settings.animations ? "on" : "off";
  }, [settings]);

  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function useSettings() {
  return useContext(SettingsContext);
}
