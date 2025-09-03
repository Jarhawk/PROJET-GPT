import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { routes, homePath } from './config/routes.js';
import Layout from './layout/Layout.jsx';
import AuthProvider from './contexts/AuthContext.jsx';

const Loader = () => <div style={{ padding: 24 }}>Chargement…</div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* public routes (login/landing/404) */}
            {routes.filter(r => !r.private).map(r => (
              <Route
                key={r.path}
                path={r.path}
                element={<r.element />}
              />
            ))}

            {/* private app shell with persistent layout */}
            <Route element={<Layout />}>
              <Route index element={<Navigate to={homePath} replace />} />
              {routes.filter(r => r.private).map(r => (
                <Route key={r.path} path={r.path} element={<r.element />} />
              ))}
            </Route>

            {/* catch-all */}
            <Route path="*" element={<Navigate to={homePath} replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

