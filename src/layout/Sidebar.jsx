import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
} from "lucide-react";

export default function Sidebar() {
  const { access_rights, loading, user, role, mama_id, logout, session } =
    useAuth();
  const { pathname } = useLocation();
  console.log("Sidebar", { user, role, mama_id, access_rights });

  if (loading || access_rights === null) {
    return (
      <aside className="w-64 p-4">
        <LoadingSpinner message="Chargement menu..." />
      </aside>
    );
  }

  const rights = typeof access_rights === "object" ? access_rights : {};
  const has = (key) => rights[key];

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

  return (
    <aside className="w-64 bg-glass border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow hidden md:block animate-fade-in-down">
      <nav className="flex flex-col gap-4 text-sm">
        {has("dashboard") && (
          <Item to="/dashboard" icon={<Home size={16} />} label="Dashboard" />
        )}

        {(has("produits") || has("inventaires") || has("mouvements")) && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Stock</p>
            <div className="flex flex-col gap-1 ml-2">
              {has("produits") && <Item to="/produits" icon={<Boxes size={16} />} label="Produits" />}
              {has("inventaires") && <Item to="/inventaire" icon={<ClipboardList size={16} />} label="Inventaire" />}
              {has("mouvements") && <Item to="/mouvements" icon={<History size={16} />} label="Mouvements" />}
            </div>
          </div>
        )}

        {(has("fournisseurs") || has("factures") || has("receptions")) && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Achats</p>
            <div className="flex flex-col gap-1 ml-2">
              {has("fournisseurs") && <Item to="/fournisseurs" icon={<Truck size={16} />} label="Fournisseurs" />}
              {has("factures") && <Item to="/factures" icon={<FileText size={16} />} label="Factures" />}
              {has("receptions") && <Item to="/receptions" icon={<FileText size={16} />} label="Réceptions" />}
            </div>
          </div>
        )}

        {(has("fiches") || has("menus") || has("carte") || has("recettes") || has("requisitions")) && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Cuisine</p>
            <div className="flex flex-col gap-1 ml-2">
              {has("fiches") && <Item to="/fiches" icon={<ChefHat size={16} />} label="Fiches" />}
              {has("menus") && <Item to="/menus" icon={<MenuIcon size={16} />} label="Menus" />}
              {has("carte") && <Item to="/carte" icon={<BookOpen size={16} />} label="Carte" />}
              {has("recettes") && <Item to="/recettes" icon={<BookOpen size={16} />} label="Recettes" />}
              {has("requisitions") && <Item to="/requisitions" icon={<ClipboardList size={16} />} label="Réquisitions" />}
            </div>
          </div>
        )}

        {(has("analyse") || has("stats") || has("reporting")) && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Analyse</p>
            <div className="flex flex-col gap-1 ml-2">
              {has("stats") && <Item to="/stats" icon={<BarChart2 size={16} />} label="Stats" />}
              {has("reporting") && <Item to="/reporting" icon={<FileBarChart size={16} />} label="Reporting" />}
              {has("analyse") && <Item to="/tableaux-de-bord" icon={<BarChart2 size={16} />} label="Tableaux de bord" />}
              {has("analyse") && <Item to="/comparatif" icon={<BarChart2 size={16} />} label="Comparatif" />}
              {has("analyse") && <Item to="/surcouts" icon={<FileBarChart size={16} />} label="Surcoûts" />}
              {has("alertes") && <Item to="/alertes" icon={<FileText size={16} />} label="Alertes" />}
            </div>
          </div>
        )}

        {(has("utilisateurs") || has("roles") || has("mamas") || has("permissions")) && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Paramètres</p>
            <div className="flex flex-col gap-1 ml-2">
              {has("utilisateurs") && <Item to="/parametrage/utilisateurs" icon={<UsersIcon size={16} />} label="Utilisateurs" />}
              {has("roles") && <Item to="/parametrage/roles" icon={<Shield size={16} />} label="Rôles" />}
              {has("mamas") && <Item to="/parametrage/mamas" icon={<Building2 size={16} />} label="Mamas" />}
              {has("permissions") && (
                <Item
                  to="/parametrage/permissions"
                  icon={<Shield size={16} />}
                  label="Permissions"
                />
              )}
              {has("settings") && <Item to="/parametrage/settings" icon={<Settings size={16} />} label="Autres" />}
            </div>
          </div>
        )}

        {has("dashboard") && (
          <div>
            <p className="uppercase text-xs font-semibold text-mamastockGold mb-1">Debug</p>
            <div className="flex flex-col gap-1 ml-2">
              <Item to="/debug/auth" icon={<Bug size={16} />} label="Debug Auth" />
            </div>
          </div>
        )}
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

