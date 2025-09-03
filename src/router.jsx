import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { buildRouteElements } from "./config/routes";
import Layout from "./layout/Layout"; // doit rendre <Outlet />
import ErrorBoundary from "./components/ErrorBoundary";

const routes = buildRouteElements(React);

function Spinner() {
  return <div style={{ padding: 24 }}>Chargement…</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {routes.map((r) => (
              <Route
                key={r.path}
                path={r.path}
                element={
                  <Suspense fallback={<Spinner />}>
                    <r.Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<div style={{ padding: 24 }}>Page introuvable</div>} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
