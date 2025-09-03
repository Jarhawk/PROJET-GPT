import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '../config/routes';
import { hasAccess } from '../lib/access'; // doit retourner true/false pour une clé; sinon renvoie toujours true.
import Icon from '../components/ui/Icon';

export default function Sidebar() {
  const { t } = useTranslation();

  const items = APP_ROUTES
    .filter(r => r.showInSidebar)
    .filter(r => !r.access || hasAccess(r.access))
    .filter((r, i, arr) => arr.findIndex(x => x.path === r.path) === i);

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-slate-900/40 backdrop-blur">
      <nav className="p-2">
        <ul className="space-y-1">
          {items.map(route => (
            <li key={route.path}>
              <NavLink
                to={route.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon name={route.icon} className="h-4 w-4 opacity-90" />
                <span>{t(route.labelKey, route.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

