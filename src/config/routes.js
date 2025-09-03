import { lazy } from 'react';

// Source unique de vérité pour les routes visibles dans la sidebar
export const APP_ROUTES = [
  {
    path: '/dashboard',
    element: lazy(() => import('../pages/Dashboard.jsx')),
    labelKey: 'nav.accueil',
    icon: 'Home',
    showInSidebar: true,
    access: 'view_dashboard',
  },
  {
    path: '/produits',
    element: lazy(() => import('../pages/produits/Produits.jsx')),
    labelKey: 'nav.produits',
    icon: 'Package',
    showInSidebar: true,
    access: 'view_produits',
  },
  {
    path: '/factures',
    element: lazy(() => import('../pages/factures/Factures.jsx')),
    labelKey: 'nav.factures',
    icon: 'FileText',
    showInSidebar: true,
    access: 'view_factures',
  },
  {
    path: '/fiches',
    element: lazy(() => import('../pages/fiches/Fiches.jsx')),
    labelKey: 'nav.fiches',
    icon: 'BookOpen',
    showInSidebar: true,
    access: 'view_fiches',
  },
  {
    // alias /stock -> Inventaire.jsx
    path: '/stock',
    element: lazy(() => import('../pages/inventaire/Inventaire.jsx')),
    labelKey: 'nav.stock',
    icon: 'Boxes',
    showInSidebar: true,
    access: 'view_stock',
  },
  // Paramétrage
  {
    path: '/parametrage/familles',
    element: lazy(() => import('../pages/parametrage/Familles.jsx')),
    labelKey: 'nav.familles',
    icon: 'Layers',
    showInSidebar: true,
    access: 'manage_parametrage',
  },
  {
    path: '/parametrage/sous-familles',
    element: lazy(() => import('../pages/parametrage/SousFamilles.jsx')),
    labelKey: 'nav.sousFamilles',
    icon: 'GitBranch',
    showInSidebar: true,
    access: 'manage_parametrage',
  },
  {
    path: '/parametrage/zones',
    element: lazy(() => import('../pages/parametrage/Zones.jsx')),
    labelKey: 'nav.zones',
    icon: 'Map',
    showInSidebar: true,
    access: 'manage_parametrage',
  },
];

// Routes techniques (détail, formulaires, etc.) non visibles dans la sidebar
export const HIDDEN_ROUTES = [
  {
    path: '/produits/:id',
    element: lazy(() => import('../pages/produits/ProduitDetail.jsx')),
    showInSidebar: false,
  },
];

