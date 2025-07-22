// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Outlet, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "@/layout/Sidebar";
import useAuth from "@/hooks/useAuth";
import useNotifications from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function Layout() {
  const { pathname } = useLocation();
  const {
    session,
    userData,
    role,
    mama_id,
    access_rights,
    loading,
    logout,
  } = useAuth();
  const { fetchUnreadCount, subscribeToNotifications } = useNotifications();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchUnreadCount().then(setUnread);
    const unsub = subscribeToNotifications(() => {
      fetchUnreadCount().then(setUnread);
    });
    return unsub;
  }, [fetchUnreadCount, subscribeToNotifications]);
  if (import.meta.env.DEV) {
    console.log("Layout", {
      session,
      userData,
      role,
      mama_id,
      access_rights,
    });
  }

  if (pathname === "/login" || pathname === "/unauthorized") return <Outlet />;

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (!session || !userData)
    return <LoadingSpinner message="Chargement utilisateur..." />;

  if (!role) {
    return (
      <div className="p-4 text-red-400">
        Erreur de permission : rôle utilisateur non trouvé. Merci de contacter
        l’administrateur.
      </div>
    );
  }

  const user = session.user;

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
              <Link to="/notifications" className="relative">
                <Bell size={20} />
                {unread > 0 && (
                  <Badge color="red" className="absolute -top-1 -right-1">
                    {unread}
                  </Badge>
                )}
              </Link>
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
