import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen w-full flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0c1624] via-[#0d1b2a] to-[#0b1321] text-slate-100">
      <aside className="w-[230px] shrink-0 border-r border-white/5 bg-white/5 backdrop-blur">
        <Sidebar />
      </aside>
      <main className="flex-1 min-h-screen">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
