import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import routes from './config/routes.merged.js';
import Layout from './layout/Layout.jsx';
import PrivateOutlet from './router/PrivateOutlet.jsx';
import Login from './pages/auth/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import PageSkeleton from './components/ui/PageSkeleton.jsx';

function lazyPage(file) {
  return lazy(() => import(`./pages/${file}`));
}

const routeObjects = routes.map(r => ({
  path: r.path,
  element: (
    <PrivateOutlet accessKey={r.accessKey}>
      <Suspense fallback={<PageSkeleton />}>
        {React.createElement(lazyPage(r.file))}
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

const router = createBrowserRouter(routerConfig);

export { routerConfig };
export default router;
