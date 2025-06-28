import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function Layout() {
  const { pathname } = useLocation();
  const { user, role, logout } = useAuth();
  if (pathname === "/login" || pathname === "/unauthorized") return <Outlet />;

  return (
    <div className="relative flex h-screen overflow-auto text-shadow">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <Sidebar />
      <div className="flex flex-col flex-1 relative z-10">
        <main className="flex-1 p-4 overflow-auto">
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
        <Footer />
      </div>
    </div>
  );
}
