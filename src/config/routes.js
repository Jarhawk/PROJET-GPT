// AUTO-GENERATED from pages_report.json – do not edit manually
import { lazy } from 'react';
import {
  LayoutDashboard,
  PackageSearch,
  Package,
  FileText,
  Factory,
  Store,
  NotebookText,
  UtensilsCrossed,
  Utensils,
  Boxes,
  Warehouse,
  ClipboardList,
  Settings,
  Users,
  Folder,
  Bell,
  ChartBar,
  ChartPie,
  Inspect,
  Layers3,
  ClipboardCheck,
  ShoppingCart,
  BadgePercent,
  Eraser,
  Mail,
  HelpCircle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

// Helper: prettify label
const pretty = (s) =>
  s
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m) => m.toUpperCase());

// Minimal mapping from file path -> route meta (icon, group, label override)
const iconFor = (path) => {
  if (path.includes('/dashboard')) return LayoutDashboard;
  if (path.includes('/produits')) return PackageSearch;
  if (path.includes('/factures')) return FileText;
  if (path.includes('/fournisseurs')) return Factory;
  if (path.includes('/fiches')) return NotebookText;
  if (path.includes('/menus/')) return UtensilsCrossed;
  if (path.endsWith('/menu/MenuDuJour.jsx') || path.endsWith('/menus/MenuDuJour.jsx'))
    return Utensils;
  if (path.includes('/stock') || path.includes('/zones')) return Boxes;
  if (path.includes('/inventaire')) return ClipboardList;
  if (path.includes('/parametrage') || path.includes('/Parametres/')) return Settings;
  if (path.includes('/utilisateurs')) return Users;
  if (path.includes('/documents')) return Folder;
  if (path.includes('/notifications')) return Bell;
  if (path.includes('/reporting') || path.includes('/stats')) return ChartBar;
  if (path.includes('/consolidation')) return Layers3;
  if (path.includes('/requisitions')) return ClipboardCheck;
  if (path.includes('/commandes')) return ShoppingCart;
  if (path.includes('/promotions')) return BadgePercent;
  if (path.includes('/pertes') || path.includes('/ecarts')) return Eraser;
  if (path.includes('/emails')) return Mail;
  if (path.includes('/aide') || path.includes('/help')) return HelpCircle;
  if (path.includes('/rgpd') || path.includes('/legal')) return ShieldCheck;
  if (path.includes('/NotFound')) return TriangleAlert;
  return Package;
};

// Use the pages_report.json generated list (imported at build/dev time)
import pagesReport from '../../pages_report.json';

// Build route path from file name
const toPath = (pageFile) => {
  // remove "pages/" and ".jsx"
  let p = pageFile.replace(/^pages\//, '').replace(/\.jsx?$/, '');
  // segments
  const parts = p.split('/');
  // kebab-case each part
  const kebab = parts
    .map((seg) =>
      seg === 'index' ? '' : seg.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    )
    .filter(Boolean);
  return '/' + kebab.join('/');
};

export const routes = pagesReport.pages
  .filter((p) => p.pageFile && !p.pageFile.includes('/public/LandingPage'))
  .map((p) => {
    const importPath = `../${p.pageFile.startsWith('pages/') ? p.pageFile : 'pages/' + p.pageFile}`;
    const path = toPath(p.pageFile);
    const label =
      (p.inferredTitle && p.inferredTitle.trim()) ||
      pretty(path.split('/').pop() || 'Accueil');
    const Icon = iconFor(p.pageFile);
    const isPublic = /pages\/auth\/|pages\/public\/|pages\/NotFound\.jsx$/.test(
      p.pageFile,
    );
    const labelKey = `nav.${path.slice(1).replace(/\//g, '_')}`;
    const accessKey = path.split('/')[1] || 'dashboard';
    return {
      path,
      importPath,
      element: lazy(() => import(/* @vite-ignore */ importPath)),
      label,
      labelKey,
      accessKey,
      icon: Icon,
      private: !isPublic,
      showInSidebar: !isPublic && !/notfound|auth|public/i.test(p.pageFile),
      group: p.pageFile.includes('/parametrage')
        ? 'parametrage'
        : p.pageFile.includes('/inventaire') ||
          p.pageFile.includes('/stock') ||
          p.pageFile.includes('/zones')
        ? 'stock'
        : p.pageFile.includes('/menus') ||
          p.pageFile.includes('/menu/') ||
          p.pageFile.includes('/cuisine')
        ? 'cuisine'
        : p.pageFile.includes('/fiches')
        ? 'cuisine'
        : p.pageFile.includes('/fournisseurs') ||
          p.pageFile.includes('/commandes') ||
          p.pageFile.includes('/factures')
        ? 'achats'
        : p.pageFile.includes('/reporting') ||
          p.pageFile.includes('/analyse') ||
          p.pageFile.includes('/stats')
        ? 'analyse'
        : 'general',
    };
  });

// Convenience: routes for the Sidebar only
export const sidebarRoutes = routes.filter((r) => r.private && r.showInSidebar);

// Home redirect: prefer dashboard if present, else first private route
export const homePath =
  routes.find((r) => r.path === '/dashboard')?.path ||
  sidebarRoutes[0]?.path ||
  '/';

