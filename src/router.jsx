import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MODULES } from '@/config/modules';
import Layout from '@/layout/Layout';
import Login from '@/pages/auth/Login';
import NotFound from '@/pages/NotFound.jsx';
import PrivateOutlet from '@/router/PrivateOutlet';
import PageSkeleton from '@/components/ui/PageSkeleton';

const MODULE_LIST = Array.isArray(MODULES) ? MODULES : [];

const preloadEntries = [];
for (const m of MODULE_LIST) {
  preloadEntries.push([m.path, m.element.preload]);
}

export const routePreloadMap = Object.fromEntries(preloadEntries);

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateOutlet />}> 
        <Route element={<Layout />}> 
          {(() => {
            const elements = [];
            for (const m of MODULE_LIST) {
              elements.push(
                <Route
                  key={m.path}
                  path={m.path}
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <m.element />
                    </Suspense>
                  }
                />
              );
            }
            return elements;
          })()}
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
