import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import routes from './config/routes.js';
import Layout from './layout/Layout.jsx';
import PrivateOutlet from './router/PrivateOutlet.jsx';
import Login from './pages/auth/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import PageSkeleton from './components/ui/PageSkeleton.jsx';

const routeObjects = routes.map((r) => ({
  path: r.path,
  element: (
    <PrivateOutlet access={r.access}>
      <Suspense fallback={<PageSkeleton />}>
        {React.createElement(lazy(r.element))}
      </Suspense>
    </PrivateOutlet>
  ),
}));

const routerConfig = [
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <PrivateOutlet>
        <Layout />
      </PrivateOutlet>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...routeObjects,
    ],
  },
  { path: '*', element: <NotFound /> },
];

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateOutlet><Layout /></PrivateOutlet>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <PrivateOutlet access={r.access}>
                  <Suspense fallback={<PageSkeleton />}>
                    {React.createElement(lazy(r.element))}
                  </Suspense>
                </PrivateOutlet>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export { routerConfig };
