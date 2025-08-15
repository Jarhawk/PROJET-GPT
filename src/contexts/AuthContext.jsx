import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userData, setUserData] = useState(null) // objet JSON de la RPC
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session ?? null)

      if (!session) { setUserData(null); setLoading(false); return }

      // 1) Bootstrap profil côté serveur (créé si manquant)
      const displayName = session.user?.user_metadata?.full_name || session.user?.email || null
      await supabase.rpc('bootstrap_my_profile', { p_nom: displayName })

      // 2) Lecture profil: la RPC renvoie un OBJET JSON (jsonb), pas .single()
      const { data, error } = await supabase.rpc('get_my_profile')
      if (!mounted) return
      if (error) {
        console.error('[get_my_profile] error', error)
        setUserData(null)
      } else {
        setUserData(data) // objet JSON
      }
      setLoading(false)
    }

    run()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess ?? null)
    })
    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  return (
    <AuthCtx.Provider value={{ session, userData, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export { AuthProvider }
