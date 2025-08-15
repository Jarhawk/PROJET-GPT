import { createContext, useContext, useEffect, useState, useCallback } from "react"
import supabase from "@/lib/supabaseClient"

export const AuthContext = createContext({
  session: null,
  userData: null,
  loading: true,
  signInWithPassword: async () => {},
  logout: async () => {}
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(session ?? null)

      if (!session) { setUserData(null); setLoading(false); return }

      // RPC renvoie un objet JSON (pas de .single())
      const { data, error } = await supabase.rpc('get_my_profile')
      if (!isMounted) return
      if (error) {
        console.error('[get_my_profile] error', error)
        setUserData(null)
      } else {
        setUserData(data)
      }
      setLoading(false)
    }
    run()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess ?? null)
    })
    return () => { isMounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  const signInWithPassword = useCallback(
    (credentials) => supabase.auth.signInWithPassword(credentials),
    []
  )

  const logout = useCallback(() => supabase.auth.signOut(), [])

  const value = { session, userData, loading, signInWithPassword, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
