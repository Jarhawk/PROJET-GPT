import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
// ✅ Étape validée

export default function Layout() {
  console.log("Layout rendu");
  const { pathname } = useLocation();
  const { user, role, logout } = useAuth();
  if (pathname === "/login" || pathname === "/unauthorized") return <Outlet />;

  return (
    <div className="flex h-screen overflow-auto text-shadow">
      <Sidebar />
      <main className="flex-1 p-4">
        <div className="flex justify-end items-center gap-2 mb-4">
          {user && (
            <>
              <span>{user.email}</span>
              {role && (
                <span className="text-xs bg-white/10 px-2 py-1 rounded capitalize">
                  {role}
                </span>
              )}
              <button
                onClick={() => {
                  logout();
                  toast.success("Déconnecté");
                }}
                className="text-red-400 hover:underline"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
