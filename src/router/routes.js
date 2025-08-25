import { Home, Boxes, FileText, ChefHat, Menu as MenuIcon, Calendar, Settings } from 'lucide-react';
import lazyWithPreload from '@/lib/lazyWithPreload';

const Dashboard = lazyWithPreload(() => import('@/pages/Dashboard.jsx'));
const Produits = lazyWithPreload(() => import('@/pages/produits/Produits.jsx'));
const Factures = lazyWithPreload(() => import('@/pages/factures/Factures.jsx'));
const Fiches = lazyWithPreload(() => import('@/pages/fiches/Fiches.jsx'));
const Menus = lazyWithPreload(() => import('@/pages/menus/Menus.jsx'));
const MenuDuJour = lazyWithPreload(() => import('@/pages/menu/MenuDuJour.jsx'));
const Zones = lazyWithPreload(() => import('@/pages/parametrage/Zones.jsx'));
const Familles = lazyWithPreload(() => import('@/pages/parametrage/Familles.jsx'));
const SousFamilles = lazyWithPreload(() => import('@/pages/parametrage/SousFamilles.jsx'));
const Unites = lazyWithPreload(() => import('@/pages/parametrage/Unites.jsx'));

export const ROUTES = [
  { path: '/dashboard', component: Dashboard, labelKey: 'nav.dashboard', icon: Home, right: 'dashboard', showInSidebar: true },
  { path: '/produits', component: Produits, labelKey: 'nav.produits', icon: Boxes, right: 'produits', showInSidebar: true },
  { path: '/factures', component: Factures, labelKey: 'nav.factures', icon: FileText, right: 'factures', showInSidebar: true },
  { path: '/fiches', component: Fiches, labelKey: 'nav.fiches', icon: ChefHat, right: 'fiches_techniques', showInSidebar: true },
  { path: '/menus', component: Menus, labelKey: 'nav.menus', icon: MenuIcon, right: 'menus', showInSidebar: true },
  { path: '/menu', component: MenuDuJour, labelKey: 'nav.menuDuJour', icon: Calendar, right: 'menu_du_jour', showInSidebar: true },
  { path: '/parametrage/zones', component: Zones, labelKey: 'nav.zones', icon: Settings, right: 'zones_stock', showInSidebar: true },
  { path: '/parametrage/familles', component: Familles, labelKey: 'nav.familles', icon: Boxes, right: 'parametrage', showInSidebar: true },
  { path: '/parametrage/sous-familles', component: SousFamilles, labelKey: 'nav.sousFamilles', icon: Boxes, right: 'parametrage', showInSidebar: true },
  { path: '/parametrage/unites', component: Unites, labelKey: 'nav.unites', icon: Boxes, right: 'parametrage', showInSidebar: true },
];

export default ROUTES;
