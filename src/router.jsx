import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import PrivateOutlet from './router/PrivateOutlet.jsx';
import { APP_ROUTES, HIDDEN_ROUTES } from './config/routes.js';

function PageSkeleton() {
  return <div style={{ padding: 16 }}>Chargement…</div>;
}

const Login = lazy(() => import('./pages/auth/Login.jsx'));

export default function AppRoutes() {
  const routesConfig = [...APP_ROUTES, ...HIDDEN_ROUTES];
  const appRoutes = routesConfig.filter(r => r.path && r.element);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Route publique: login */}
        <Route path="/login" element={<Login />} />

        {/* Espace protégé */}
        <Route element={<PrivateOutlet />}>
          <Route element={<Layout />}>
            {appRoutes.map((r) => {
              const Component = r.element;
              return (
                <Route
                  key={r.path}
                  path={r.path}
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Component />
                    </Suspense>
                  }
                />
              );
            })}
            {/* Accueil → dashboard si présent, sinon première route */}
            <Route index element={<Navigate to={getDefaultHome(appRoutes)} replace />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to={getDefaultHome(appRoutes)} replace />} />
      </Routes>
    </Suspense>
  );
}

// Choisit la page d’accueil par défaut
function getDefaultHome(routes) {
  const dashboard = routes.find(r => r.path === '/dashboard');
  return dashboard ? '/dashboard' : (routes[0]?.path || '/login');
}
