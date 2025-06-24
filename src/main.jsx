import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import "@/i18n/i18n";
import "./registerSW.js";
import { BrowserRouter } from "react-router-dom";

// Option sentry/reporting
// import * as Sentry from "@sentry/react";
// Sentry.init({ dsn: "https://xxx.ingest.sentry.io/xxx" });

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
