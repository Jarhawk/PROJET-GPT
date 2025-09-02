import { NavLink, useLocation } from 'react-router-dom';
import routes from '../config/routes.js';
import { hasRight } from '../lib/access.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import * as Icons from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Icon({ name }) {
  const Cmp = Icons[name] || Icons.Square;
  return <Cmp className="h-4 w-4" aria-hidden="true" />;
}

export default function Sidebar() {
  const { user } = useAuth?.() || { user: null };
  const location = useLocation();
  const { t } = useTranslation();

  const items = routes.filter(r => r.showInSidebar && hasRight(user, r.access));

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background text-foreground">
      <nav className="p-2 space-y-1">
        {items.map(r => (
          <NavLink
            key={r.path}
            to={r.path}
            end={r.exact}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                'hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              ].join(' ')
            }
            aria-current={location.pathname === r.path ? 'page' : undefined}
          >
            <Icon name={r.icon || 'Square'} />
            <span>{t(r.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
