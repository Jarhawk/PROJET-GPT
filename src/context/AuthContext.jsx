// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Contexte global Auth
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);             // Session Supabase
  const [user, setUser] = useState(null);                   // Objet user (email, id, etc.)
  const [claims, setClaims] = useState(null);               // { role, mama_id, access_rights }
  const [loading, setLoading] = useState(true);             // Chargement initial/refresh
  const [claimsError, setClaimsError] = useState(null);

  // Récupérer les claims personnalisés depuis la table "users"
  const fetchClaims = useCallback(async (userId) => {
    if (!userId) {
      setClaims(null);
      setClaimsError(null);
      return;
    }
    const { data, error } = await supabase
      .from("users")
      .select("role, mama_id, access_rights")
      .eq("id", userId)
      .single();

    if (error) {
      setClaims(null);
      setClaimsError(error.message || "Erreur lors de la récupération des droits utilisateur.");
      console.error("Erreur récupération claims:", error);
    } else if (!data) {
      setClaims(null);
      setClaimsError("Aucune information utilisateur trouvée pour ce compte.");
    } else {
      setClaims(data);
      setClaimsError(null);
    }
  }, []);

  // Initialisation / listener session Supabase
  useEffect(() => {
    setLoading(true);

    // Check session à l'ouverture
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchClaims(session.user.id);
      setLoading(false);
    });

    // Listener sur les changements d'état auth
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        setLoading(true);
        await fetchClaims(session.user.id);
        setLoading(false);
      } else {
        setClaims(null);
        setClaimsError(null);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [fetchClaims]);

  // Rafraîchit manuellement les claims (ex: changement de droits à chaud)
  const refreshClaims = useCallback(() => {
    if (user?.id) fetchClaims(user.id);
  }, [user, fetchClaims]);

  // Déconnexion utilisateur
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setClaims(null);
    setClaimsError(null);
    window.location.href = "/login";
  };

  // Exporte le contexte
  const value = {
    session,
    user,
    claims,             // { role, mama_id, access_rights }
    loading,
    claimsError,
    logout,
    refreshClaims,
    isAuthenticated: !!user && !!claims,
    isAdmin: claims?.role === "admin" || claims?.role === "superadmin",
    mama_id: claims?.mama_id || null,
    access_rights: claims?.access_rights || [],
    role: claims?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Affiche une alerte si claims non trouvés */}
      {claimsError && (
        <div className="fixed top-4 right-4 bg-red-700 text-white px-4 py-2 rounded-lg shadow z-50 animate-fade-in">
          <b>Erreur sécurité :</b> {claimsError}
        </div>
      )}
    </AuthContext.Provider>
  );
}

// Hook d'accès au contexte Auth
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext) || {};
}
