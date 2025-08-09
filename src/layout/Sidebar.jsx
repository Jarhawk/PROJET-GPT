// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useLocation } from "react-router-dom";
import { routePreloadMap } from "@/router";
import useAuth from "@/hooks/useAuth";
import logo from "@/assets/logo-mamastock.png";
import {
  Boxes,
  ClipboardList,
  History,
  Truck,
  FileText,
  ChefHat,
  Menu as MenuIcon,
  BookOpen,
  BarChart2,
  FileBarChart,
  Settings,
  Users as UsersIcon,
  Shield,
  Building2,
  Home,
  Key,
  Calendar,
  CheckSquare,
  HelpCircle,
  Gift,
  Bell,
  Mail,
  MessageCircle,
  Plug,
} from "lucide-react";

export default function Sidebar() {
  const {
    access_rights,
    loading,
    user,
    userData,
    mama_id,
    hasAccess,
  } = useAuth();
  const { pathname } = useLocation();
  if (import.meta.env.DEV) {
    console.debug("Sidebar", { user, mama_id, access_rights });
  }

  if (loading || !user || !userData || !access_rights) {
    return null;
  }

  const peutVoir = (module) => {
    const ok = hasAccess(module, "peut_voir");
    if (!ok && access_rights && !access_rights[module]) {
      console.info(`info: module '${module}' absent des access_rights`);
    }
    return ok;
  };

  const Item = ({ to, icon, label }) => {
    const prefetch = () => {
      const fn = routePreloadMap[to];
      if (fn) fn();
    };
    return (
      <Link
        to={to}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        onClick={prefetch}
        className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 ${
          pathname.startsWith(to) ? "bg-white/10 text-mamastockGold" : ""
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  const groups = [
    {
      title: "Stock",
      items: [
        { module: "produits", to: "/produits", label: "Produits", icon: <Boxes size={16} /> },
        { module: "inventaires", to: "/inventaire", label: "Inventaire", icon: <ClipboardList size={16} /> },
      ],
    },
    {
      title: "Achats",
      items: [
        { module: "fournisseurs", to: "/fournisseurs", label: "Fournisseurs", icon: <Truck size={16} /> },
        { module: "factures", to: "/factures", label: "Factures", icon: <FileText size={16} /> },
        { module: "factures", to: "/factures/import", label: "Import e-factures", icon: <FileText size={16} /> },
        { module: "achats", to: "/achats", label: "Achats", icon: <FileText size={16} /> },
        { module: "receptions", to: "/receptions", label: "Réceptions", icon: <FileText size={16} /> },
        { module: "bons_livraison", to: "/bons-livraison", label: "Bons de Livraison", icon: <FileText size={16} /> },
      ],
    },
    {
      title: "Documents",
      items: [
        { module: "documents", to: "/documents", label: "Documents", icon: <FileText size={16} /> },
      ],
    },
    {
      title: "Notifications",
      items: [
        { module: "notifications", to: "/notifications", label: "Notifications", icon: <Bell size={16} /> },
        { module: "emails_envoyes", to: "/emails/envoyes", label: "Emails envoyés", icon: <Mail size={16} /> },
      ],
    },
    {
      title: "Planning",
      items: [
        { module: "planning_previsionnel", to: "/planning", label: "Prévisionnel", icon: <Calendar size={16} /> },
        { module: "planning_previsionnel", to: "/planning/simulation", label: "Simulation", icon: <Calendar size={16} /> },
      ],
    },
    {
      title: "Organisation",
      items: [
        { module: "taches", to: "/taches", label: "Tâches", icon: <CheckSquare size={16} /> },
        { module: "alertes", to: "/taches/alertes", label: "Alertes", icon: <ClipboardList size={16} /> },
      ],
    },
    {
      title: "Cuisine",
      items: [
        { module: "fiches_techniques", to: "/fiches", label: "Fiches", icon: <ChefHat size={16} /> },
        { module: "menus", to: "/menus", label: "Menus", icon: <MenuIcon size={16} /> },
        { module: "menu_du_jour", to: "/menu", label: "Menu du jour", icon: <MenuIcon size={16} /> },
        { module: "carte", to: "/carte", label: "Carte", icon: <BookOpen size={16} /> },
        { module: "recettes", to: "/recettes", label: "Recettes", icon: <BookOpen size={16} /> },
        { module: "requisitions", to: "/requisitions", label: "Réquisitions", icon: <ClipboardList size={16} /> },
      ],
    },
    {
      title: "Analyse",
      items: [
        { module: "stats", to: "/stats", label: "Stats", icon: <BarChart2 size={16} /> },
        { module: "consolidation", to: "/consolidation", label: "Consolidation", icon: <FileBarChart size={16} /> },
        { module: "reporting", to: "/reporting", label: "Reporting", icon: <FileBarChart size={16} /> },
        { module: "analyse", to: "/tableaux-de-bord", label: "Tableaux de bord", icon: <BarChart2 size={16} /> },
        { module: "analyse", to: "/comparatif", label: "Comparatif", icon: <BarChart2 size={16} /> },
        { module: "analyse", to: "/surcouts", label: "Surcoûts", icon: <FileBarChart size={16} /> },
        { module: "alertes", to: "/alertes", label: "Alertes", icon: <FileText size={16} /> },
      ],
    },
    {
      title: "Paramètres",
      items: [
        { module: "utilisateurs", to: "/parametrage/utilisateurs", label: "Utilisateurs", icon: <UsersIcon size={16} /> },
        { module: "mamas", to: "/parametrage/mamas", label: "Mamas", icon: <Building2 size={16} /> },
        { module: "permissions", to: "/parametrage/permissions", label: "Permissions", icon: <Shield size={16} /> },
        { module: "access", to: "/parametrage/access", label: "Accès", icon: <Shield size={16} /> },
        { module: "apikeys", to: "/parametrage/api-keys", label: "API Keys", icon: <Key size={16} /> },
        { module: "parametrage", to: "/parametrage/api-fournisseurs", label: "API Fournisseurs", icon: <Plug size={16} /> },
        { module: "settings", to: "/parametrage/settings", label: "Autres", icon: <Settings size={16} /> },
        { module: "zones_stock", to: "/parametrage/zones-stock", label: "Zones de stock", icon: <Boxes size={16} /> },
        { module: "parametrage", to: "/parametrage/familles", label: "Familles", icon: <Boxes size={16} /> },
        { module: "parametrage", to: "/parametrage/unites", label: "Unités", icon: <Boxes size={16} /> },
        { module: "licences", to: "/parametrage/licences", label: "Licences", icon: <Key size={16} /> },
        { module: "parametrage", to: "/consentements", label: "Consentements", icon: <CheckSquare size={16} /> },
      ],
    },
    {
      title: "Logs",
      items: [
        { module: "logs", to: "/logs", label: "Logs", icon: <History size={16} /> },
      ],
    },
    {
      title: "Aide",
      items: [
        { module: "aide", to: "/aide", label: "Aide", icon: <HelpCircle size={16} /> },
        { module: "feedback", to: "/feedback", label: "Feedback", icon: <MessageCircle size={16} /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white/10 border border-white/10 backdrop-blur-xl text-white h-screen shadow-md text-shadow hidden md:flex md:flex-col animate-fade-in-down">
      <img
        src={logo}
        alt="MamaStock"
        className="h-20 mx-auto mt-4 mb-6"
      />
      <nav className="flex flex-col gap-4 text-sm p-4 flex-1 overflow-y-auto">
        {peutVoir("dashboard") && (
          <Item to="/dashboard" icon={<Home size={16} />} label="Dashboard" />
        )}

        {groups.map((group) => {
          const visible = group.items.filter((i) => peutVoir(i.module));
          if (visible.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">
                {group.title}
              </p>
              <div className="flex flex-col gap-1 ml-2">
                {visible.map((item) => (
                  <Item
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

