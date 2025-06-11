// src/layout/Sidebar.jsx
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import mamaLogo from "@/assets/logo-mamastock.png";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function Sidebar() {
  const { access_rights } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState({
    achats: false,
    cuisine: false,
    stock: false,
    analyse: false,
    parametrage: false,
  });

  // Utilitaire : teste si l'utilisateur a ce droit (clé)
  const hasRight = (key) => Array.isArray(access_rights) && access_rights.includes(key);

  // Pour des groupes de droits
  const hasAny = (keys) => Array.isArray(access_rights) && keys.some((k) => access_rights.includes(k));

  useEffect(() => {
    const path = location.pathname;
    setOpen({
      achats: path.includes("/fournisseurs") || path.includes("/factures") || path.includes("/produits"),
      cuisine: path.includes("/fiches") || path.includes("/menus"),
      stock: path.includes("/inventaire") || path.includes("/mouvements") || path.includes("/requisitions"),
      analyse: path.includes("/cost-boisson"),
      parametrage: path.includes("/parametrage"),
    });
  }, [location.pathname]);

  return (
    <aside className="w-64 bg-mamastockBg text-mamastockText border-r border-mamastockGold shadow-md flex flex-col">
      <div className="flex flex-col items-center p-6 border-b border-mamastockGold">
        <img src={mamaLogo} alt="MamaStock" className="w-48 h-auto mb-2" />
        <span className="text-lg font-semibold text-mamastockGold tracking-widest">Menu</span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-mamastockGold/50">
        {hasRight("dashboard") && (
          <SidebarLink to="/" label="Dashboard" icon="📊" />
        )}

        {hasAny(["factures", "produits", "fournisseurs"]) && (
          <SidebarSection
            label="Achats & Produits"
            open={open.achats}
            toggle={() => setOpen((prev) => ({ ...prev, achats: !prev.achats }))}
            items={[
              hasRight("fournisseurs") && { to: "/fournisseurs", label: "Fournisseurs" },
              hasRight("produits") && { to: "/produits", label: "Produits" },
              hasRight("factures") && { to: "/factures", label: "Factures" },
            ].filter(Boolean)}
          />
        )}

        {hasAny(["fiches", "menus"]) && (
          <SidebarSection
            label="Cuisine"
            open={open.cuisine}
            toggle={() => setOpen((prev) => ({ ...prev, cuisine: !prev.cuisine }))}
            items={[
              hasRight("fiches") && { to: "/fiches", label: "Fiches Techniques" },
              hasRight("menus") && { to: "/menus", label: "Menus du jour" },
            ].filter(Boolean)}
          />
        )}

        {hasAny(["inventaire", "mouvements", "requisitions"]) && (
          <SidebarSection
            label="Stock"
            open={open.stock}
            toggle={() => setOpen((prev) => ({ ...prev, stock: !prev.stock }))}
            items={[
              hasRight("inventaire") && { to: "/inventaire", label: "Inventaire" },
              hasRight("mouvements") && { to: "/mouvements", label: "Mouvements" },
              hasRight("requisitions") && { to: "/requisitions", label: "Réquisitions" },
            ].filter(Boolean)}
          />
        )}

        {hasRight("costboisson") && (
          <SidebarSection
            label="Analyse"
            open={open.analyse}
            toggle={() => setOpen((prev) => ({ ...prev, analyse: !prev.analyse }))}
            items={[{ to: "/cost-boisson", label: "Cost Boisson" }]}
          />
        )}

        {hasRight("parametrage") && (
          <SidebarSection
            label="Paramétrage"
            open={open.parametrage}
            toggle={() => setOpen((prev) => ({ ...prev, parametrage: !prev.parametrage }))}
            items={[
              hasRight("roles") && { to: "/parametrage/roles", label: "Rôles" },
              hasRight("utilisateurs") && { to: "/parametrage/utilisateurs", label: "Utilisateurs" },
              hasRight("mamas") && { to: "/parametrage/mamas", label: "Établissements" },
              hasRight("permissions") && { to: "/parametrage/permissions", label: "Droits personnalisés" },
            ].filter(Boolean)}
          />
        )}
      </nav>
    </aside>
  );
}

function SidebarLink({ to, label, icon = null }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
        active ? "bg-mamastockGold text-black" : "hover:bg-white/10 text-mamastockText"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </Link>
  );
}

function SidebarSection({ label, open, toggle, items }) {
  return (
    <div>
      <button
        onClick={toggle}
        className={`w-full flex justify-between items-center px-4 py-2 rounded-lg font-semibold transition ${
          open ? "bg-mamastockGold text-black" : "hover:bg-white/10 text-mamastockText"
        }`}
      >
        <span>{label}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && Array.isArray(items) && (
        <div className="pl-4 mt-1 space-y-1">
          {items.map(({ to, label }) => (
            <SidebarLink key={to} to={to} label={label} />
          ))}
        </div>
      )}
    </div>
  );
}
