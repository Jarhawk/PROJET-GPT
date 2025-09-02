import generated from './routes.generated.json' assert { type: 'json' };

export const ROUTES = [
  { path:'/dashboard', element: () => import('../pages/Dashboard.jsx'), labelKey:'menu.dashboard', icon:'LayoutDashboard', access:'view_dashboard', showInSidebar:true },
  { path:'/produits', element:() => import('../pages/produits/Produits.jsx'), labelKey:'menu.produits', icon:'Package', access:'view_produits', showInSidebar:true },
  { path:'/factures', element:() => import('../pages/factures/Factures.jsx'), labelKey:'menu.factures', icon:'Receipt', access:'view_factures', showInSidebar:true },
  { path:'/fiches', element:() => import('../pages/fiches/Fiches.jsx'), labelKey:'menu.fiches', icon:'BookOpen', access:'view_fiches', showInSidebar:true },
  { path:'/menus', element:() => import('../pages/menus/Menus.jsx'), labelKey:'menu.menus', icon:'Utensils', access:'view_menus', showInSidebar:true },
  { path:'/menu-jour', element:() => import('../pages/menus/MenuDuJour.jsx'), labelKey:'menu.menuDuJour', icon:'CalendarClock', access:'view_menu_jour', showInSidebar:true },
  { path:'/stock', element:() => import('../pages/inventaire/Inventaire.jsx'), labelKey:'menu.stock', icon:'Boxes', access:'view_stock', showInSidebar:true },
  { path:'/parametrage/familles', element:() => import('../pages/parametrage/Familles.jsx'), labelKey:'menu.familles', icon:'TreeDeciduous', access:'view_parametrage', showInSidebar:true },
  { path:'/parametrage/sous-familles', element:() => import('../pages/parametrage/SousFamilles.jsx'), labelKey:'menu.sousFamilles', icon:'GitBranch', access:'view_parametrage', showInSidebar:true },
  { path:'/parametrage/unites', element:() => import('../pages/parametrage/Unites.jsx'), labelKey:'menu.unites', icon:'Ruler', access:'view_parametrage', showInSidebar:true },
  { path:'/parametrage/zones', element:() => import('../pages/parametrage/Zones.jsx'), labelKey:'menu.zones', icon:'Warehouse', access:'view_parametrage', showInSidebar:true },
];

for (const r of generated) {
  if (!ROUTES.some(x => x.path === r.path)) ROUTES.push(r);
}

export default ROUTES;
