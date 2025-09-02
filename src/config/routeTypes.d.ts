export type AccessKey = string | null | undefined;

export interface RouteMeta {
  path: string;                // '/produits'
  file: string;                // 'produits/Produits.jsx' (chemin relatif à src/pages)
  labelKey?: string;           // 'nav.produits'
  icon?: string;               // nom Lucide ex: 'Package', 'LayoutDashboard'
  showInSidebar?: boolean;     // défaut true
  group?: string;              // 'Produits', 'Facturation', etc.
  exact?: boolean;             // défaut false
  accessKey?: AccessKey;       // clé de droit (lib/access.js)
  featureFlag?: string;        // clé feature dans config/modules.js
}
