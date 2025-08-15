// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import useMamaSettings from "@/hooks/useMamaSettings";
import logo from "@/assets/logo-mamastock.png";
import { normalizeAccessKey } from '@/lib/access'

export default function Sidebar() {
  const { loading: authLoading, hasAccess, userData } = useAuth();
  const { pathname } = useLocation();
  const { loading: settingsLoading, enabledModules } = useMamaSettings();
  const rights = userData?.access_rights ?? {};
  console.debug('[sidebar] rights keys', Object.keys(rights || {}));
  console.debug('[sidebar] enabledModules keys', enabledModules ? Object.keys(enabledModules) : null);

  const has = (key) => {
    const k = normalizeAccessKey(key)
    const isEnabled = enabledModules ? enabledModules[k] !== false : true
    return hasAccess(k) && isEnabled
  }
  const canAnalyse = has('analyse');

  return (
    <aside className="w-64 bg-white/10 border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow">
      <img src={logo} alt="MamaStock" className="h-20 mx-auto mt-4 mb-6" />
      <nav className="flex flex-col gap-2 text-sm">
        {has("dashboard") && <Link to="/dashboard">Dashboard</Link>}

        {(has("fournisseurs") || has("factures")) && (
          <details open={pathname.startsWith("/fournisseurs") || pathname.startsWith("/factures")}>
            <summary className="cursor-pointer">Achats</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("fournisseurs") && <Link to="/fournisseurs">Fournisseurs</Link>}
              {has("factures") && <Link to="/factures">Factures</Link>}
            </div>
          </details>
        )}

        {(has("fiches_techniques") || has("menus")) && (
          <details open={pathname.startsWith("/fiches") || pathname.startsWith("/menus")}>
            <summary className="cursor-pointer">Cuisine</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("fiches_techniques") && <Link to="/fiches">Fiches</Link>}
              {has("menus") && <Link to="/menus">Menus</Link>}
              {has("menu_du_jour") && <Link to="/menu">Menu du jour</Link>}
            </div>
          </details>
        )}

        {(has("produits") || has("inventaires")) && (
          <details open={pathname.startsWith("/produits") || pathname.startsWith("/inventaire")}>
            <summary className="cursor-pointer">Stock</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("produits") && <Link to="/produits">Produits</Link>}
              {has("inventaires") && <Link to="/inventaire">Inventaire</Link>}
            </div>
          </details>
        )}

        {(has("alertes") || has("promotions")) && (
          <details open={pathname.startsWith("/alertes") || pathname.startsWith("/promotions")}>
            <summary className="cursor-pointer">Alertes / Promotions</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("alertes") && <Link to="/alertes">Alertes</Link>}
              {has("promotions") && <Link to="/promotions">Promotions</Link>}
            </div>
          </details>
        )}

        {(has("documents") || canAnalyse || has("menu_engineering")) && (
          <details
            open=
              {pathname.startsWith("/documents") ||
                pathname.startsWith("/analyse") ||
                pathname.startsWith("/engineering") ||
                pathname.startsWith("/menu-engineering")}
          >
            <summary className="cursor-pointer">Documents / Analyse</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("documents") && <Link to="/documents">Documents</Link>}
              {canAnalyse && <Link to="/analyse">Analyse</Link>}
              {has("menu_engineering") && (
                <Link to="/menu-engineering">Menu Engineering</Link>
              )}
              {canAnalyse && <Link to="/engineering">Engineering</Link>}
              {has("costing_carte") && <Link to="/costing/carte">Costing Carte</Link>}
            </div>
          </details>
        )}

        {has("notifications") && <Link to="/notifications">Notifications</Link>}

        {(has("parametrage") ||
          has("utilisateurs") ||
          has("roles") ||
          has("mamas") ||
          has("permissions") ||
          has("access")) && (
          <details open={pathname.startsWith("/parametrage")}>
            <summary className="cursor-pointer">Paramétrage</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("utilisateurs") && (
                <Link to="/parametrage/utilisateurs">Utilisateurs</Link>
              )}
              {has("roles") && <Link to="/parametrage/roles">Rôles</Link>}
              {has("mamas") && <Link to="/parametrage/mamas">Mamas</Link>}
              {has("permissions") && (
                <Link to="/parametrage/permissions">Permissions</Link>
              )}
              {has("access") && <Link to="/parametrage/access">Accès</Link>}
            </div>
          </details>
        )}

        <Link to="/onboarding">Onboarding</Link>
        <Link to="/aide">Aide</Link>
        {has("feedback") && <Link to="/feedback">Feedback</Link>}
        {import.meta.env.DEV && (
          <Link to="/debug/auth" className="text-xs opacity-50 mt-4">
            Debug Auth
          </Link>
        )}
      </nav>
    </aside>
  );
}
