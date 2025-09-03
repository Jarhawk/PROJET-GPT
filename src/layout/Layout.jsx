import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex">
      <Sidebar key="app-sidebar" />
      <main className="flex-1 min-w-0 bg-white">
        <Outlet context={{ currentPath: location.pathname }} />
      </main>
    </div>
  );
}

