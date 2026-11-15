import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
    </PrefsProvider>
  </StrictMode>
);
