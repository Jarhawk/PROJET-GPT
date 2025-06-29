// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import "@/i18n/i18n";
import "./registerSW.js";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// Option sentry/reporting
// import * as Sentry from "@sentry/react";
// Sentry.init({ dsn: "https://xxx.ingest.sentry.io/xxx" });

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
