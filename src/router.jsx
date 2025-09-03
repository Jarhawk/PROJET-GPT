import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import { APP_ROUTES, HIDDEN_ROUTES } from './config/routes';
import { useAuth } from './contexts/AuthContext.jsx';
import { hasAccess } from './lib/access.js';

const Login = lazy(() => import('./pages/auth/Login.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function Spinner() {
  return <div className="p-6 text-slate-300">Chargement…</div>;
}

function RouteGuard({ requiredRight }) {
  const { user, rights, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasAccess(requiredRight, rights)) return <Navigate to="/403" replace />;

  return <Outlet />;
}

export default function AppRouter() {
  const ALL_ROUTES = [...APP_ROUTES, ...HIDDEN_ROUTES];
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            {/* zone publique */}
            <Route path="/login" element={<Login />} />

            {/* zone privée */}
            {ALL_ROUTES.map(r => {
              const Page = r.element;
              return (
                <Route
                  key={r.path}
                  element={<RouteGuard requiredRight={r.access} />}
                >
                  <Route path={r.path} element={<Page />} />
                </Route>
              );
            })}

            {/* 403/404 */}
            <Route path="/403" element={<div className="p-6">Accès refusé</div>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
