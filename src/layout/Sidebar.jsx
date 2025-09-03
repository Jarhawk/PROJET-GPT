import React from 'react';
import { NavLink } from 'react-router-dom';
import { sidebarRoutes } from '@/config/routes.js';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const { access_rights, rightsLoading } = useAuth();
  if (rightsLoading) return null;

  const visible = sidebarRoutes.filter((r) => {
    const moduleKey = r.path.slice(1).split('/')[0] || 'dashboard';
    const mod = access_rights?.[moduleKey];
    return mod?.peut_voir !== false;
  });

  return (
    <nav className="py-4">
      <div className="px-4 mb-4 font-black tracking-wide text-yellow-300">MAMASTOCK</div>
      <ul className="space-y-1">
        {visible.map((r) => (
          <li key={r.path}>
            <NavLink
              to={r.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <r.icon size={16} className="mr-2 opacity-90" />
              <span className="text-sm">{r.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
