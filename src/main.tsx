import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";
import { PrefsProvider } from "./lib/prefs";
import { SettingsProvider } from "./lib/site-settings";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrefsProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1px solid var(--line)",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
          },
        }}
      />
    </PrefsProvider>
  </StrictMode>
);
