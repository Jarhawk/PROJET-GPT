import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { session, role } = useAuth();

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Voulez-vous vraiment vous déconnecter ?");
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-mamastock-bg border-b border-mamastock-gold text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* Logo / Titre */}
      <h1 className="text-2xl font-bold text-mamastock-gold tracking-widest">
        MAMA STOCK
      </h1>

      {/* Zone utilisateur */}
      <div className="flex items-center gap-4">
        {session?.user?.email && typeof session.user.email === "string" ? (
          <>
            <span className="text-sm text-mamastock-text font-medium">
              {session.user.email}
            </span>
            <span className="text-xs bg-mamastock-gold text-black px-3 py-1 rounded-full capitalize shadow">
              {role || "chargement..."}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <span className="text-sm text-mamastock-text italic">Connexion...</span>
        )}
      </div>
    </nav>
  );
}
