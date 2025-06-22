import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";

export default function Layout() {
  const { pathname } = useLocation();
  if (pathname === "/login" || pathname === "/unauthorized") return <Outlet />;

  return (
    <div className="flex h-screen overflow-auto text-shadow">
      <Sidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
