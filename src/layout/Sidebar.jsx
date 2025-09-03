import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext.jsx';
import { hasAccess } from '../lib/access.js';
import Icon from '../components/ui/Icon';

export default function Sidebar() {
  const { t } = useTranslation();
  const { rights } = useAuth();

  const items = APP_ROUTES
    .filter(r => r.showInSidebar)
    .filter(r => hasAccess(r.access, rights));

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-slate-900/40 backdrop-blur">
      <nav className="p-2">
        <ul className="space-y-1">
          {items.map(r => (
            <li key={r.path}>
              <NavLink
                to={r.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                    isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon name={r.icon} className="h-4 w-4" />
                <span>{t(r.labelKey, r.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
