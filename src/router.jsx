import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { APP_ROUTES, HIDDEN_ROUTES } from './config/routes';
import PrivateOutlet from './router/PrivateOutlet.jsx'; // chemin existant dans le projet

// Rend toutes les routes en s'appuyant sur la config centralisée
export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<PrivateOutlet />}>
          {APP_ROUTES.concat(HIDDEN_ROUTES).map(r => (
            <Route key={r.path} path={r.path} element={<r.element />} />
          ))}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

