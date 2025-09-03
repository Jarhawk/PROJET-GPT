import React from 'react';
import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  // { to: '/produits', label: 'Produits', icon: 'Boxes' },
  // { to: '/factures', label: 'Factures', icon: 'Receipt' },
];

function Icon({ name }) {
  const Ico = Icons[name] ?? Icons.Circle;
  return <Ico size={16} className="mr-2 opacity-90" />;
}

export default function Sidebar() {
  return (
    <nav className="py-4">
      <div className="px-4 mb-4 font-black tracking-wide text-yellow-300">MAMASTOCK</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition
                 ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`
              }
            >
              <Icon name={it.icon} />
              <span className="text-sm">{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
