// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import 'nprogress/nprogress.css';
import "@/i18n/i18n";
import "./registerSW.js";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "@/contexts/AuthContext";
import { toast } from 'sonner';

// Avoid noisy output in production by disabling debug logs
if (!import.meta.env.DEV) {
  console.debug = () => {};
}

if (import.meta?.env?.DEV || process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.toast = toast;
}

// Option sentry/reporting
// import * as Sentry from "@sentry/react";
// Sentry.init({ dsn: "https://xxx.ingest.sentry.io/xxx" });

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
