// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import 'nprogress/nprogress.css';
import "@/i18n/i18n";
import "./registerSW.js";
import { HashRouter } from "react-router-dom"; // Use hash-based routing to handle deep links without server fallback
import AuthProvider from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { ensureSingleOwner, releaseLock } from '@/lib/lock';
import { monitorShutdownRequests, shutdownDbSafely } from '@/lib/shutdown';

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

await ensureSingleOwner();
await monitorShutdownRequests();
window.addEventListener('beforeunload', () => {
  shutdownDbSafely();
  releaseLock();
});

// Global error handlers for future debugging
// window.addEventListener('error', (event) => {
//   console.error('Global error:', event.error);
// });
// window.addEventListener('unhandledrejection', (event) => {
//   console.error('Unhandled promise rejection:', event.reason);
// });

// Option sentry/reporting
// import * as Sentry from "@sentry/react";
// Sentry.init({ dsn: "https://xxx.ingest.sentry.io/xxx" });

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
