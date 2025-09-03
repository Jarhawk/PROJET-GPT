import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import { routes, homePath } from './config/routes.js';
import AuthProvider from './contexts/AuthContext.jsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query.js';
// Optionnel debug devtools :
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const Loader = () => <div style={{ padding: 24 }}>Chargement…</div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Routes publiques */}
              {routes.filter(r => !r.private).map(r => (
                <Route key={r.path} path={r.path} element={<r.element />} />
              ))}

              {/* Shell persistant : Layout (Sidebar + Outlet) pour les routes privées */}
              <Route element={<Layout />}>
                <Route index element={<Navigate to={homePath} replace />} />
                {routes.filter(r => r.private).map(r => (
                  <Route key={r.path} path={r.path} element={<r.element />} />
                ))}
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to={homePath} replace />} />
            </Routes>

            {/* Devtools optionnel en dev */}
            {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
          </Suspense>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
