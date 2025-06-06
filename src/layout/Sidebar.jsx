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

  const handleToggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const has = (keys) => keys.some((key) => access_rights?.[key]);

  return (
    <aside className="w-64 bg-mamastockBg text-mamastockText border-r border-mamastockGold shadow-md flex flex-col">
      <div className="flex flex-col items-center p-6 border-b border-mamastockGold">
        <img src={mamaLogo} alt="MamaStock" className="w-48 h-auto mb-2" />
        <span className="text-lg font-semibold text-mamastockGold tracking-widest">Menu</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-mamastockGold/50">
        {access_rights?.dashboard && (
          <SidebarLink to="/dashboard" label="Dashboard" icon="📊" />
        )}

        {has(["factures", "produits", "fournisseurs"]) && (
          <SidebarSection
            label="Achats & Produits"
            open={open.achats}
            toggle={() => handleToggle("achats")}
            items={[
              access_rights?.fournisseurs && { to: "/fournisseurs", label: "Fournisseurs" },
              access_rights?.produits && { to: "/produits", label: "Produits" },
              access_rights?.factures && { to: "/factures", label: "Factures" },
            ].filter(Boolean)}
          />
        )}

        {has(["fiches", "menus"]) && (
          <SidebarSection
            label="Cuisine"
            open={open.cuisine}
            toggle={() => handleToggle("cuisine")}
            items={[
              access_rights?.fiches && { to: "/fiches", label: "Fiches Techniques" },
              access_rights?.menus && { to: "/menus", label: "Menus du jour" },
            ].filter(Boolean)}
          />
        )}

        {has(["inventaire", "mouvements", "requisitions"]) && (
          <SidebarSection
            label="Stock"
            open={open.stock}
            toggle={() => handleToggle("stock")}
            items={[
              access_rights?.inventaire && { to: "/inventaire", label: "Inventaire" },
              access_rights?.mouvements && { to: "/mouvements", label: "Mouvements" },
              access_rights?.requisitions && { to: "/requisitions", label: "Réquisitions" },
            ].filter(Boolean)}
          />
        )}

        {access_rights?.costboisson && (
          <SidebarSection
            label="Analyse"
            open={open.analyse}
            toggle={() => handleToggle("analyse")}
            items={[{ to: "/cost-boisson", label: "Cost Boisson" }]}
          />
        )}

        {access_rights?.parametrage && (
          <SidebarSection
            label="Paramétrage"
            open={open.parametrage}
            toggle={() => handleToggle("parametrage")}
            items={[
              access_rights?.roles && { to: "/parametrage/roles", label: "Rôles" },
              access_rights?.utilisateurs && { to: "/parametrage/utilisateurs", label: "Utilisateurs" },
              access_rights?.mamas && { to: "/parametrage/mamas", label: "Établissements" },
              access_rights?.permissions && { to: "/parametrage/permissions", label: "Droits personnalisés" },
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
