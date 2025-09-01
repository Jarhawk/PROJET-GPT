import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import defaultLogo from '@/assets/logo-mamastock.png';
import { MODULES } from '@/config/modules';
import { routePreloadMap } from '@/router';
import { useAuth } from '@/hooks/useAuth';
import { useMamaSettings } from '@/hooks/useMamaSettings';
import { useTheme } from '@/context/ThemeProvider';

export default function Sidebar() {
  const { hasAccess = () => false, loading: authLoading } = useAuth();
  const { featureFlags, loading: settingsLoading } = useMamaSettings();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { logo } = useTheme();

  if (authLoading || settingsLoading) return null;

  const modules = Array.isArray(MODULES) ? MODULES : [];
  const flagOK = flag => (flag ? featureFlags?.[flag] !== false : true);
  const navItems = modules
    .filter(m => m.showInSidebar && hasAccess(m.rightKey) && flagOK(m.featureFlag))
    .map(m => {
      const Icon = m.icon;
      const prefetch = () => {
        const fn = routePreloadMap[m.path];
        if (fn) fn();
      };
      return (
        <Link
          key={m.path}
          to={m.path}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 ${
            pathname.startsWith(m.path) ? 'bg-white/10 text-mamastockGold' : ''
          }`}
          aria-current={pathname.startsWith(m.path) ? 'page' : undefined}
        >
          <Icon size={16} aria-hidden="true" />
          <span>{t(m.labelKey)}</span>
        </Link>
      );
    });

  const logoSrc = logo || defaultLogo;

  return (
    <aside className="w-64 bg-white/10 border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow hidden md:flex md:flex-col">
      <img src={logoSrc} alt="MamaStock" className="h-20 mx-auto mt-4 mb-6" />
      <nav aria-label={t('nav.main')} className="flex flex-col gap-2 text-sm">
        {navItems}
      </nav>
    </aside>
  );
}
