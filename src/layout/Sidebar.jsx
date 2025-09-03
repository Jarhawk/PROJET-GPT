import React from "react";
import { NavLink } from "react-router-dom";
import * as Lucide from "lucide-react";
import { ROUTES } from "../config/routes";
import { pageExists } from "../lib/lazyPage";
import { useTranslation } from "react-i18next";

function IconByName({ name, className }) {
  const I = Lucide[name] || Lucide.Circle;
  return <I className={className} aria-hidden="true" />;
}

export default function Sidebar() {
  const { t } = useTranslation();

  const items = ROUTES.filter(
    (r) => r.showInSidebar !== false && pageExists(r.file)
  );

  return (
    <aside className="sidebar">
      <nav className="menu">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `menu-item ${isActive ? "is-active" : ""}`
            }
            end
          >
            <IconByName name={item.icon} className="menu-icon" />
            <span className="menu-label">
              {t(item.labelKey, item.labelKey)}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// CSS supposé existant: .menu-item, .is-active, .menu-icon, etc.
// Garder les classes actuelles si elles existent pour respecter le thème.
