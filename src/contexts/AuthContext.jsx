import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export const AuthContext = createContext({
  session: null,
  user: null,
  userData: null,
  loading: true,
  signInWithPassword: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (authId) => {
    if (!authId) return null;
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("*")
      .eq("auth_id", authId)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!active) return;
      setSession(currentSession);

      if (currentSession?.user) {
        const user = await loadUserData(currentSession.user.id);
        if (!active) return;
        setUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const user = await loadUserData(newSession.user.id);
          setUserData(user);
        } else {
          setUserData(null);
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signInWithPassword = useCallback(
    (credentials) => supabase.auth.signInWithPassword(credentials),
    []
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = {
    session,
    user: session?.user ?? null,
    userData,
    loading,
    signInWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

