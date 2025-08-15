// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "@/lib/supabaseClient";
import useNotifications from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import PageSkeleton from "@/components/ui/PageSkeleton";
import AlertBadge from "@/components/stock/AlertBadge";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function Layout() {
  const { session, userData, loading } = useAuth();
  const { fetchUnreadCount, subscribeToNotifications } = useNotifications();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchUnreadCount().then(setUnread);
    const unsub = subscribeToNotifications(() => {
      fetchUnreadCount().then(setUnread);
    });
    return unsub;
  }, [fetchUnreadCount, subscribeToNotifications]);
  if (loading) {
    return <PageSkeleton />;
  }
  const user = session?.user;

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
              <AlertBadge />
              <span>{user.email}</span>
              {userData.nom && (
                <span className="text-xs bg-white/10 px-2 py-1 rounded capitalize">
                  {userData.nom}
                </span>
              )}
              <button
                onClick={() => {
                  supabase.auth.signOut();
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
