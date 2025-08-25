import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo-mamastock.png';
import { ROUTES } from '@/router/routes';
import { routePreloadMap } from '@/router';
import useAuth from '@/hooks/useAuth';
import { useMamaSettings } from '@/hooks/useMamaSettings';

export default function Sidebar() {
  const { hasAccess, loading: authLoading } = useAuth();
  const { featureFlags, loading: settingsLoading } = useMamaSettings();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (authLoading || settingsLoading) return null;

  const flagOK = (flag) => (flag ? featureFlags?.[flag] !== false : true);
  const items = ROUTES.filter(
    (r) => r.showInSidebar && hasAccess(r.right) && flagOK(r.featureFlag)
  );

  return (
    <aside className="w-64 bg-white/10 border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow hidden md:flex md:flex-col">
      <img src={logo} alt="MamaStock" className="h-20 mx-auto mt-4 mb-6" />
      <nav className="flex flex-col gap-2 text-sm">
        {items.map((r) => {
          const Icon = r.icon;
          const prefetch = () => {
            const fn = routePreloadMap[r.path];
            if (fn) fn();
          };
          return (
            <Link
              key={r.path}
              to={r.path}
              onMouseEnter={prefetch}
              onFocus={prefetch}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 ${
                pathname.startsWith(r.path) ? 'bg-white/10 text-mamastockGold' : ''
              }`}
            >
              <Icon size={16} />
              <span>{t(r.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
