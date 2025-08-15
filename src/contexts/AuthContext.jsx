import { createContext, useContext, useEffect, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const initRef = useRef(false)
  const lastLoadedUserRef = useRef(null)

  async function loadProfile(sess) {
    try {
      if (!sess) { setUserData(null); return }
      const displayName = sess.user?.user_metadata?.full_name || sess.user?.email || null
      await supabase.rpc('bootstrap_my_profile', { p_nom: displayName })
      const { data, error } = await supabase.rpc('get_my_profile') // jsonb objet
      if (error) { console.error('[get_my_profile] error', error); setUserData(null) }
      else { setUserData(data) }
    } catch (e) { console.error('[auth] loadProfile failed', e); setUserData(null) }
  }

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    console.info('[auth] init once')
    let mounted = true
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session ?? null)
      if (session) {
        lastLoadedUserRef.current = session?.user?.id || null
        setLoading(true)
        await loadProfile(session)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      setSession(sess ?? null)
      if (sess?.user?.id && lastLoadedUserRef.current === sess.user.id && userData) return
      console.info('[auth] onAuthStateChange -> loadProfile for', sess?.user?.id)
      lastLoadedUserRef.current = sess?.user?.id || null
      setLoading(true)
      await loadProfile(sess)
      setLoading(false)
    })
    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  return <AuthCtx.Provider value={{ session, userData, loading }}>{children}</AuthCtx.Provider>
}

export default AuthProvider
export { AuthProvider }

