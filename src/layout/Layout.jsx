import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

export default function Layout() {
  const { pathname } = useLocation();
  if (pathname === "/login") return <Outlet />;

  return (
    <div className="flex h-screen overflow-auto">
      <Sidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
