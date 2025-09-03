import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { APP_ROUTES as routesConfig } from '../config/routes.js';
import { canShowRoute } from '../lib/access.js';

function ContentSkeleton() {
  return (
    <div className="p-4">
      <div className="h-6 w-48 mb-4 bg-neutral-200 rounded" />
      <div className="h-4 w-full mb-2 bg-neutral-100 rounded" />
      <div className="h-4 w-2/3 mb-2 bg-neutral-100 rounded" />
      <div className="h-4 w-1/3 bg-neutral-100 rounded" />
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const { access_rights, rightsLoading } = useAuth();

  // Construit les routes visibles. Important: ne pas renvoyer [] pendant le chargement
  const sidebarRoutes = useMemo(() => {
    const base = routesConfig.filter(r => r.showInSidebar !== false);
    return base.filter((r) => canShowRoute(r, access_rights));
  }, [access_rights]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar TOUJOURS montée */}
      <Sidebar routes={sidebarRoutes} loading={rightsLoading} currentPath={pathname} />

      {/* Contenu */}
      <main className="flex-1 min-w-0 bg-white">
        {rightsLoading ? <ContentSkeleton /> : <Outlet />}
      </main>
    </div>
  );
}
