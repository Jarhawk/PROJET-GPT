// src/layout/Sidebar.jsx
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import mamaLogo from "@/assets/logo-mamastock.png";
import { ChevronRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useSwipe } from "@/hooks/useSwipe";

const MENUS = [
  {
    label: "Dashboard",
    icon: "📊",
    to: "/dashboard",
    accessKey: "dashboard",
  },
  {
    label: "Stock",
    icon: "📦",
    accessKey: "stock",
    children: [
      { label: "Produits", to: "/produits" },
      { label: "Mouvements", to: "/mouvements" },
      { label: "Pertes", to: "/pertes" },
      { label: "Stock synthèse", to: "/stock" },
    ],
  },
  {
    label: "Fiches techniques",
    icon: "📑",
    to: "/fiches",
    accessKey: "fiches",
  },
  {
    label: "Carte",
    icon: "🍽️",
    to: "/carte",
    accessKey: "fiches",
  },
  {
    label: "Menu Engineering",
    icon: "📊",
    to: "/menu-engineering",
    accessKey: "fiches",
  },
  {
    label: "Inventaire",
    icon: "📋",
    to: "/inventaire",
    accessKey: "inventaire",
  },
  {
    label: "Factures",
    icon: "🧾",
    to: "/factures",
    accessKey: "factures",
  },
  {
    label: "Import e-factures",
    icon: "⬆️",
    to: "/factures/import",
    accessKey: "factures",
  },
  {
    label: "Promotions",
    icon: "🏷️",
    to: "/promotions",
    accessKey: "promotions",
  },
  {
    label: "Menus du jour",
    icon: "🍽️",
    to: "/menus",
    accessKey: "menus",
  },
  {
    label: "Tâches",
    icon: "🗓️",
    to: "/taches",
    accessKey: "taches",
  },
  {
    label: "Planning",
    icon: "🗓️",
    to: "/planning",
    accessKey: "planning",
  },
  {
    label: "Alertes",
    icon: "🔔",
    to: "/alertes",
    accessKey: "alertes",
  },
  {
    label: "Documents",
    icon: "📂",
    to: "/documents",
    accessKey: "documents",
  },
  {
    label: "Validations",
    icon: "✅",
    to: "/validations",
    accessKey: "validations",
  },
  {
    label: "Fournisseurs",
    icon: "🏢",
    to: "/fournisseurs",
    accessKey: "fournisseurs",
  },
  {
    label: "Comparatif prix",
    icon: "💶",
    to: "/fournisseurs/comparatif",
    accessKey: "fournisseurs",
  },
  {
    label: "Journal",
    icon: "📝",
    to: "/journal",
    accessKey: "audit",
  },
  { label: "Audit avancé", icon: "📜", to: "/audit-trail", accessKey: "audit" },
  {
    label: "Statistiques",
    icon: "📈",
    accessKey: "dashboard",
    children: [
      { label: "Cost centers", to: "/stats/cost-centers" },
      { label: "CC mensuels", to: "/stats/cost-centers-monthly" },
      { label: "Stocks produits", to: "/stats/stocks" },
      { label: "Consolidation", to: "/stats/consolidation" },
      { label: "Analytique avancée", to: "/stats/advanced" },
    ],
  },
  { label: "Onboarding", icon: "❓", to: "/onboarding", accessKey: "dashboard" },
  { label: "Aide", icon: "💡", to: "/aide", accessKey: "dashboard" },
  {
    label: "Paramétrage",
    icon: "⚙️",
    accessKey: "parametrage",
    children: [
      { label: "Utilisateurs", to: "/utilisateurs" },
      { label: "Rôles", to: "/parametrage/roles" },
      { label: "Permissions", to: "/parametrage/permissions" },
      { label: "Établissements", to: "/parametrage/mamas" },
      { label: "Paramétrage global", to: "/parametrage" },
    ],
  },
];

export default function Sidebar() {
  const { access_rights } = useAuth();
  const location = useLocation();
  const containerRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(access_rights) && access_rights.length === 0) {
      console.warn("Aucun droit d'accès défini pour l'utilisateur", access_rights);
    }
  }, [access_rights]);

  if (!access_rights) return <div>Chargement des droits...</div>;

  // Permet de voir quels menus sont ouverts selon la route active
  const [open, setOpen] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  useSwipe(containerRef, {
    onSwipeLeft: () => setMobileOpen(false),
    onSwipeRight: () => setMobileOpen(true),
  });
  useEffect(() => {
    const toggle = () => setMobileOpen(o => !o);
    document.addEventListener('toggle-sidebar', toggle);
    return () => document.removeEventListener('toggle-sidebar', toggle);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const newOpen = {};
    MENUS.forEach((menu, idx) => {
      if (menu.children) {
        // Ouvre la section si la route actuelle commence par un des children
        newOpen[idx] = menu.children.some(child => path.startsWith(child.to));
      }
    });
    setOpen(newOpen);
  }, [location.pathname]);

  const hasAccess = (accessKey) =>
    access_rights?.includes?.(accessKey) ||
    (typeof access_rights === "object" && access_rights?.[accessKey]);

  return (
    <aside
      ref={containerRef}
      className={`w-64 min-h-screen bg-white/50 backdrop-blur-2xl border-r border-mamastockGold shadow-lg flex flex-col glass-sidebar transition-all transform md:translate-x-0 ${isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
      style={{
        boxShadow:
          "0 8px 32px 0 rgba(31, 38, 135, 0.23), 0 1.5px 8px 0 #bfa14d55",
        borderRadius: "2rem 0 0 2rem",
      }}
    >
      <div className="flex flex-col items-center p-6 border-b border-mamastockGold">
        <img
          src={mamaLogo}
          alt="MamaStock"
          className="w-36 h-auto mb-2 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 0 16px #bfa14d88)" }}
        />
        <span className="text-lg font-semibold text-mamastockGold tracking-widest drop-shadow-sm">
          Menu
        </span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-mamastockGold/50">
        {MENUS.filter(m => hasAccess(m.accessKey)).map((menu, idx) =>
          menu.children ? (
            <SidebarSection
              key={menu.label}
              label={menu.label}
              icon={menu.icon}
              open={!!open[idx]}
              onToggle={() => setOpen(o => ({ ...o, [idx]: !o[idx] }))}
              childrenLinks={menu.children}
            />
          ) : (
            <SidebarLink
              key={menu.label}
              to={menu.to}
              label={menu.label}
              icon={menu.icon}
              active={location.pathname === menu.to}
            />
          )
        )}
      </nav>
      <style>
        {`
          .glass-sidebar {
            background: linear-gradient(120deg, rgba(255,255,255,0.85) 40%, rgba(191,161,77,0.07) 100%);
            border-right: 2px solid #bfa14d55;
          }
        `}
      </style>
    </aside>
  );
}

function SidebarLink({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium
        ${active
          ? "bg-mamastockGold/90 text-black shadow-lg"
          : "hover:bg-white/20 text-mamastockText"}
      `}
      style={{
        boxShadow: active
          ? "0 8px 16px 0 #bfa14d55"
          : "0 1.5px 8px 0 rgba(191,161,77,0.08)",
        backdropFilter: "blur(4px)",
      }}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </Link>
  );
}

function SidebarSection({ label, icon, open, onToggle, childrenLinks }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex justify-between items-center px-4 py-2 rounded-lg font-semibold transition
          ${open ? "bg-mamastockGold/80 text-black shadow-lg" : "hover:bg-white/10 text-mamastockText"}
        `}
        style={{
          boxShadow: open
            ? "0 8px 16px 0 #bfa14d55"
            : "0 1.5px 8px 0 rgba(191,161,77,0.08)",
        }}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-4 mt-1 space-y-1"
            transition={{ duration: 0.21 }}
          >
            {childrenLinks.map(link => (
              <SidebarLink key={link.to} to={link.to} label={link.label} />
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
