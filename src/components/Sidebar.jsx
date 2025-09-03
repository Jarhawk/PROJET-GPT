import React from 'react';
import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';

export default function Sidebar({ routes = [], loading = false, currentPath: _currentPath }) {
  // Fallback léger pendant le chargement des droits, mais la Sidebar reste visible
  return (
    <aside className="w-64 border-r bg-neutral-50 sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 font-semibold">MamaStock</div>
      <nav className="px-2 py-1 space-y-1">
        {(routes.length === 0 && !loading) && (
          <div className="text-sm text-neutral-500 px-2">Aucun module</div>
        )}
        {loading && (
          <div className="px-2">
            <div className="h-4 w-32 mb-2 bg-neutral-200 rounded" />
            <div className="h-4 w-40 mb-2 bg-neutral-200 rounded" />
            <div className="h-4 w-28 bg-neutral-200 rounded" />
          </div>
        )}
        {routes.map((r) => {
          const Icon = r.icon && Icons[r.icon] ? Icons[r.icon] : Icons.LayoutGrid;
          return (
            <NavLink
              key={r.path}
              to={r.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition 
                ${isActive ? 'bg-neutral-200 font-medium' : 'hover:bg-neutral-100'}`
              }
              end
            >
              <Icon size={18} aria-hidden />
              <span>{r.label ?? r.labelKey ?? r.path}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
