// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useLocation } from "react-router-dom";
// Le menu latéral n'affiche que les modules pour lesquels
// l'utilisateur possède le droit "peut_voir". Les droits proviennent
// du contexte d'authentification (merge utilisateur + rôle).
import useAuth from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

import MamaLogo from "@/components/ui/MamaLogo";

export default function Sidebar() {
  const { access_rights, isSuperadmin, loading, pending, hasAccess } = useAuth();
  const { pathname } = useLocation();

  if (loading || pending || access_rights === null) return null;
  const has = (key) => isSuperadmin || hasAccess(key, "peut_voir");
  const canAnalyse = has("analyse");

  return (
    <aside className="w-64 bg-glass border border-white/10 backdrop-blur-xl text-white p-4 h-screen shadow-md text-shadow">
      <div className="mb-6">
        <MamaLogo width={140} />
      </div>
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
            </div>
          </details>
        )}

        {(has("produits") || has("inventaires") || has("mouvements")) && (
          <details open={pathname.startsWith("/produits") || pathname.startsWith("/inventaire") || pathname.startsWith("/mouvements")}> 
            <summary className="cursor-pointer">Stock</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("produits") && <Link to="/produits">Produits</Link>}
              {has("inventaires") && <Link to="/inventaire">Inventaire</Link>}
              {has("mouvements") && <Link to="/mouvements">Mouvements</Link>}
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
          <details open={pathname.startsWith("/documents") || pathname.startsWith("/analyse") || pathname.startsWith("/engineering") || pathname.startsWith("/menu-engineering")}>
            <summary className="cursor-pointer">Documents / Analyse</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("documents") && <Link to="/documents">Documents</Link>}
              {canAnalyse && <Link to="/analyse">Analyse</Link>}
              {has("menu_engineering") && (
                <Link to="/menu-engineering">Menu Engineering</Link>
              )}
              {canAnalyse && <Link to="/engineering">Engineering</Link>}
            </div>
          </details>
        )}

        {has("notifications") && <Link to="/notifications">Notifications</Link>}

        {(has("parametrage") || has("utilisateurs") || has("roles") || has("mamas") || has("permissions") || has("access")) && (
          <details open={pathname.startsWith("/parametrage")}> 
            <summary className="cursor-pointer">Paramétrage</summary>
            <div className="ml-4 flex flex-col gap-1 mt-1">
              {has("utilisateurs") && <Link to="/parametrage/utilisateurs">Utilisateurs</Link>}
              {has("roles") && <Link to="/parametrage/roles">Rôles</Link>}
              {has("mamas") && <Link to="/parametrage/mamas">Mamas</Link>}
              {has("permissions") && <Link to="/parametrage/permissions">Permissions</Link>}
              {has("access") && <Link to="/parametrage/access">Accès</Link>}
            </div>
          </details>
        )}

        <Link to="/onboarding">Onboarding</Link>
        <Link to="/aide">Aide</Link>
        {has("feedback") && <Link to="/feedback">Feedback</Link>}
      </nav>
    </aside>
  );
}
