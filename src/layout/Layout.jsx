import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

export default function Layout() {
  const { pathname } = useLocation();
  if (pathname === "/login") return <Outlet />;

  return (
    <div className="flex h-screen overflow-auto" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      <Sidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
