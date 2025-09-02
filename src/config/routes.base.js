/** @type {import('./routeTypes').RouteMeta[]} */
const baseRoutes = [
  { path: '/dashboard', file: 'Dashboard.jsx', labelKey: 'nav.dashboard', icon: 'LayoutDashboard', showInSidebar: true, group: 'Général', accessKey: 'DASHBOARD_VIEW' },
  // Ajouter ici les overrides spécifiques si nécessaire (icône/label/flags/rights)
];

export default baseRoutes;
