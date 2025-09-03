import { NavLink, useLocation } from 'react-router-dom';
import { sidebarRoutes } from '../config/routes.js';

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-64 border-r bg-neutral-50 sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 font-semibold">MamaStock</div>
      <nav className="px-2 py-1 space-y-1">
        <ul>
          {sidebarRoutes.map((r) => {
            const Icon = r.icon;
            const active = pathname === r.path || pathname.startsWith(r.path + '/');
            return (
              <li key={r.path} className={active ? 'font-medium' : ''}>
                <NavLink
                  to={r.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                      isActive ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                    }`
                  }
                  end
                >
                  {Icon ? <Icon className="icon" aria-hidden /> : null}
                  <span>{r.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

