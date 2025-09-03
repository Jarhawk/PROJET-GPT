// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./globals.css";
import 'nprogress/nprogress.css';
import "@/i18n/i18n";
import "./registerSW.js";
import AuthProvider from "@/contexts/AuthContext";
import { toast } from 'sonner';

// Avoid noisy output in production by disabling debug logs
if (!import.meta.env.DEV) {
  console.debug = () => {};
}

if (import.meta?.env?.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()));
  if (window.caches?.keys) {
    caches
      .keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

if (import.meta?.env?.DEV) {
  // @ts-ignore
  window.toast = toast;
}

// Option sentry/reporting
// import * as Sentry from "@sentry/react";
// Sentry.init({ dsn: "https://xxx.ingest.sentry.io/xxx" });

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
