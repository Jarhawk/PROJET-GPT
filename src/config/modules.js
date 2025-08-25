import { Home, Boxes, FileText, ChefHat, Menu as MenuIcon, Calendar, Settings } from 'lucide-react';
import lazyWithPreload from '@/lib/lazyWithPreload';

export const MODULES = [
  {
    path: '/dashboard',
    element: lazyWithPreload(() => import('@/pages/Dashboard.jsx')),
    labelKey: 'nav.dashboard',
    icon: Home,
    rightKey: 'dashboard',
    showInSidebar: true,
  },
  {
    path: '/produits',
    element: lazyWithPreload(() => import('@/pages/produits/Produits.jsx')),
    labelKey: 'nav.produits',
    icon: Boxes,
    rightKey: 'produits',
    showInSidebar: true,
  },
  {
    path: '/factures',
    element: lazyWithPreload(() => import('@/pages/factures/Factures.jsx')),
    labelKey: 'nav.factures',
    icon: FileText,
    rightKey: 'factures',
    showInSidebar: true,
  },
  {
    path: '/fiches',
    element: lazyWithPreload(() => import('@/pages/fiches/Fiches.jsx')),
    labelKey: 'nav.fiches',
    icon: ChefHat,
    rightKey: 'fiches_techniques',
    showInSidebar: true,
  },
  {
    path: '/menus',
    element: lazyWithPreload(() => import('@/pages/menus/Menus.jsx')),
    labelKey: 'nav.menus',
    icon: MenuIcon,
    rightKey: 'menus',
    showInSidebar: true,
  },
  {
    path: '/menu',
    element: lazyWithPreload(() => import('@/pages/menu/MenuDuJour.jsx')),
    labelKey: 'nav.menuDuJour',
    icon: Calendar,
    rightKey: 'menu_du_jour',
    showInSidebar: true,
  },
  {
    path: '/parametrage/zones',
    element: lazyWithPreload(() => import('@/pages/parametrage/Zones.jsx')),
    labelKey: 'nav.zones',
    icon: Settings,
    rightKey: 'zones_stock',
    showInSidebar: true,
  },
  {
    path: '/parametrage/familles',
    element: lazyWithPreload(() => import('@/pages/parametrage/Familles.jsx')),
    labelKey: 'nav.familles',
    icon: Boxes,
    rightKey: 'parametrage',
    showInSidebar: true,
  },
  {
    path: '/parametrage/sous-familles',
    element: lazyWithPreload(() => import('@/pages/parametrage/SousFamilles.jsx')),
    labelKey: 'nav.sousFamilles',
    icon: Boxes,
    rightKey: 'parametrage',
    showInSidebar: true,
  },
  {
    path: '/parametrage/unites',
    element: lazyWithPreload(() => import('@/pages/parametrage/Unites.jsx')),
    labelKey: 'nav.unites',
    icon: Boxes,
    rightKey: 'parametrage',
    showInSidebar: true,
  },
];

export default MODULES;
