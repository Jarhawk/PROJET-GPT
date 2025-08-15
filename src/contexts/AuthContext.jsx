import { useEffect, useState, useRef, createContext, useContext } from 'react'
import supabase from '@/lib/supabaseClient'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)
  const initRef = useRef(false)
  const lastLoadedUserRef = useRef(null)
  const pollTimerRef = useRef(null)

  async function loadProfile(sess) {
    if (!sess) { setUserData(null); return }
    const displayName = sess.user?.user_metadata?.full_name || sess.user?.email || null
    await supabase.rpc('bootstrap_my_profile', { p_nom: displayName })
    const { data, error } = await supabase.rpc('get_my_profile')
    if (error) { console.error(error); setUserData(null) }
    else { setUserData(data) }
  }

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    console.info('[auth] init once')
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session ?? null)
      if (session) { setLoading(true); await loadProfile(session) }
      setLoading(false)
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      console.info('[auth] onAuthStateChange -> loadProfile for', sess?.user?.id)
      setSession(sess ?? null)
      setLoading(true)
      if (sess?.user?.id && lastLoadedUserRef.current === sess.user.id && userData) {
        setLoading(false)
        return
      }
      lastLoadedUserRef.current = sess?.user?.id || null
      await loadProfile(sess)
      setLoading(false)
    })
    let tries = 0
    const tick = async () => {
      tries++
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !userData) {
        setSession(session)
        setLoading(true)
        await loadProfile(session)
        setLoading(false)
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      } else if (tries >= 10) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
    pollTimerRef.current = window.setInterval(tick, 500)
    return () => { sub?.subscription?.unsubscribe?.(); if (pollTimerRef.current) window.clearInterval(pollTimerRef.current) }
  }, [])

  return <AuthCtx.Provider value={{ session, userData, loading }}>{children}</AuthCtx.Provider>
}

export default AuthProvider
export { AuthProvider }
