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

if (import.meta?.env?.DEV || process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.toast = toast;
}

// Enhance number inputs globally: set inputmode, pattern and comma-to-dot conversion
function enhanceNumberInputs(root = document) {
  root.querySelectorAll('input[type="number"]').forEach((inp) => {
    if (inp.dataset.numEnhanced) return;
    inp.dataset.numEnhanced = '1';
    inp.setAttribute('inputmode', 'decimal');
    inp.setAttribute('pattern', '[0-9]*[.,]?[0-9]*');
    inp.addEventListener('change', () => {
      inp.value = inp.value.replace(',', '.');
    });
  });
}

enhanceNumberInputs();
new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const n of m.addedNodes) {
      if (n instanceof HTMLElement) enhanceNumberInputs(n);
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });

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
