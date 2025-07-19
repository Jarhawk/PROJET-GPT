// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
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
  Bug,
  Key,
  Calendar,
  CheckSquare,
  HelpCircle,
  Gift,
  Bell,
  MessageCircle,
  Plug,
} from "lucide-react";

export default function Sidebar() {
  const {
    access_rights,
    loading,
    user,
    role,
    mama_id,
    logout,
    session,
    isSuperadmin,
  } = useAuth();
  const { pathname } = useLocation();
  if (import.meta.env.DEV) {
    console.log("Sidebar", { user, role, mama_id, access_rights });
  }

  if (loading || !user || !access_rights) {
    return null;
  }

  const peutVoir = (module) =>
    isSuperadmin || access_rights?.[module]?.peut_voir === true;

  const Item = ({ to, icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 ${
        pathname.startsWith(to) ? "bg-white/10 text-mamastockGold" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  const groups = [
    {
      title: "Stock",
      items: [
        { module: "produits", to: "/produits", label: "Produits", icon: <Boxes size={16} /> },
        { module: "inventaires", to: "/inventaire", label: "Inventaire", icon: <ClipboardList size={16} /> },
        { module: "mouvements", to: "/mouvements", label: "Mouvements", icon: <History size={16} /> },
      ],
    },
    {
      title: "Achats",
      items: [
        { module: "fournisseurs", to: "/fournisseurs", label: "Fournisseurs", icon: <Truck size={16} /> },
        { module: "factures", to: "/factures", label: "Factures", icon: <FileText size={16} /> },
        { module: "factures", to: "/factures/import", label: "Import e-factures", icon: <FileText size={16} /> },
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
      title: "Tâches",
      items: [
        { module: "taches", to: "/taches", label: "Tâches", icon: <CheckSquare size={16} /> },
        { module: "alertes", to: "/taches/alertes", label: "Alertes", icon: <ClipboardList size={16} /> },
        { module: "produits", to: "/promotions", label: "Promotions", icon: <Gift size={16} /> },
      ],
    },
    {
      title: "Cuisine",
      items: [
        { module: "fiches_techniques", to: "/fiches", label: "Fiches", icon: <ChefHat size={16} /> },
        { module: "menus", to: "/menus", label: "Menus", icon: <MenuIcon size={16} /> },
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
        { module: "roles", to: "/parametrage/roles", label: "Rôles", icon: <Shield size={16} /> },
        { module: "mamas", to: "/parametrage/mamas", label: "Mamas", icon: <Building2 size={16} /> },
        { module: "permissions", to: "/parametrage/permissions", label: "Permissions", icon: <Shield size={16} /> },
        { module: "access", to: "/parametrage/access", label: "Accès", icon: <Shield size={16} /> },
        { module: "apikeys", to: "/parametrage/api-keys", label: "API Keys", icon: <Key size={16} /> },
        { module: "parametrage", to: "/parametrage/api-fournisseurs", label: "API Fournisseurs", icon: <Plug size={16} /> },
        { module: "settings", to: "/parametrage/settings", label: "Autres", icon: <Settings size={16} /> },
        { module: "zones_stock", to: "/parametrage/zones-stock", label: "Zones de stock", icon: <Boxes size={16} /> },
        { module: "licences", to: "/parametrage/licences", label: "Licences", icon: <Key size={16} /> },
        { module: "parametrage", to: "/consentements", label: "Consentements", icon: <CheckSquare size={16} /> },
      ],
    },
    {
      title: "Audit",
      items: [
        { module: "audit", to: "/audit", label: "Audit", icon: <History size={16} /> },
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
    <aside className="w-64 bg-glass border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow hidden md:block animate-fade-in-down">
      <nav className="flex flex-col gap-4 text-sm">
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
      {session && (
        <div className="mt-6 border-t border-white/20 pt-4 text-sm flex flex-col gap-2">
          <span>Bienvenue, {user?.email}</span>
          <button
            onClick={() => {
              logout();
              toast.success('Déconnexion réussie');
            }}
            className="text-left text-red-400 hover:underline"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </aside>
  );
}

