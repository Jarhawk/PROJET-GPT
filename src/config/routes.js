import { lazyPage } from "../lib/lazyPage";

// Icônes lucide-react par nom dynamique
export const ICONS = new Proxy({}, {
  get: (_, name) => {
    try {
      // import() dynamique pour ne charger que ce qui est nécessaire
      // NB: en JSX on utilisera le nom pour récupérer l’icône via lazyIcon()
      return name;
    } catch {
      return "Circle";
    }
  }
});

// Déclaration *déterministe* des routes connues.
// file = chemin relatif à src/pages/ (ex: "factures/Factures.jsx")
// labelKey = clé i18n à afficher dans la sidebar
// icon = nom d'icône lucide-react (ex: "FileText", "Boxes", etc.)
export const ROUTES = [
  { path: "/dashboard",  file: "Dashboard.jsx",                 labelKey: "nav.dashboard",         icon: "LayoutDashboard", showInSidebar: true },
  { path: "/produits",   file: "produits/Produits.jsx",         labelKey: "nav.produits",          icon: "PackageSearch",   showInSidebar: true },
  { path: "/produits/nouveau", file: "produits/ProduitForm.jsx", labelKey: "nav.produits.new",     icon: "PlusCircle",      showInSidebar: false },
  { path: "/factures",   file: "factures/Factures.jsx",         labelKey: "nav.factures",          icon: "FileText",        showInSidebar: true },
  { path: "/fiches",     file: "fiches/Fiches.jsx",             labelKey: "nav.fiches",            icon: "ChefHat",         showInSidebar: true },
  { path: "/menus",      file: "menus/Menus.jsx",               labelKey: "nav.menus",             icon: "Utensils",        showInSidebar: true },
  { path: "/menu-jour",  file: "menus/MenuDuJour.jsx",          labelKey: "nav.menuDuJour",        icon: "CalendarDays",    showInSidebar: true },
  { path: "/stock",      file: "stock/Stock.jsx",               labelKey: "nav.stock",             icon: "Boxes",           showInSidebar: true },
  { path: "/inventaire", file: "inventaire/Inventaire.jsx",     labelKey: "nav.inventaire",        icon: "ClipboardList",   showInSidebar: true },
  // Paramétrage
  { path: "/parametrage/familles",      file: "parametrage/Familles.jsx",      labelKey: "nav.familles",      icon: "Shapes",      showInSidebar: true },
  { path: "/parametrage/sous-familles", file: "parametrage/SousFamilles.jsx",  labelKey: "nav.sousFamilles",  icon: "Layers3",     showInSidebar: true },
  { path: "/parametrage/unites",        file: "parametrage/Unites.jsx",        labelKey: "nav.unites",        icon: "Ruler",       showInSidebar: true },
  { path: "/parametrage/zones",         file: "parametrage/Zones.jsx",         labelKey: "nav.zones",         icon: "MapPinned",   showInSidebar: true },
  // Ajoute ici d'autres pages détectées si nécessaire
];

// Fabrique prête pour <Routes> (React.lazy + Suspense)
export function buildRouteElements(React) {
  return ROUTES.map((r) => {
    const Component = lazyPage(r.file);
    return { ...r, Component };
  });
}
