import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import Layout from '@/layout/Layout';
import Login from '@/pages/auth/Login';
import NotFound from '@/pages/NotFound.jsx';
import PrivateOutlet from '@/router/PrivateOutlet';
import PageSkeleton from '@/components/ui/PageSkeleton';

export const routePreloadMap = Object.fromEntries(
  ROUTES.map(r => [r.path, r.component.preload])
);

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateOutlet />}>
        <Route element={<Layout />}>
          {ROUTES.map(r => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <r.component />
                </Suspense>
              }
            />
          ))}
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
