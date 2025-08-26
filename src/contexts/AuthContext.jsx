import { useEffect, useState, useRef, createContext, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseInitError } from '@/lib/supabase'
import { normalizeAccessKey } from '@/lib/access'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)
  const rights = useMemo(() => userData?.access_rights ?? {}, [userData?.access_rights])
  const initRef = useRef(false)
  const lastLoadedUserRef = useRef(null)
  const pollTimerRef = useRef(null)
  const navigate = useNavigate()

  async function loadProfile(sess) {
    if (!sess) { setUserData(null); return }
    const displayName = sess.user?.user_metadata?.full_name || sess.user?.email || null
    await supabase.rpc('bootstrap_my_profile', { p_nom: displayName })
    const { data, error } = await supabase.rpc('get_my_profile')
    if (error) { console.error(error); setUserData(null) }
    else { setUserData(data) }
  }

  useEffect(() => {
    if (supabaseInitError || initRef.current) return
    initRef.current = true
    if (import.meta.env.DEV) console.debug('[auth] init')
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session ?? null)
      setUser(session?.user ?? null)
      if (session) {
        setLoading(true)
        if (import.meta.env.DEV) console.time('[auth] loadProfile')
        await loadProfile(session)
        if (import.meta.env.DEV) console.timeEnd('[auth] loadProfile')
        setLoading(false)
        navigate('/dashboard')
      }
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      setSession(sess ?? null)
      setUser(sess?.user ?? null)
      if (sess) {
        setLoading(true)
        if (import.meta.env.DEV) console.time('[auth] loadProfile')
        await loadProfile(sess)
        if (import.meta.env.DEV) console.timeEnd('[auth] loadProfile')
        setLoading(false)
        navigate('/dashboard')
      } else {
        setUserData(null)
      }
    })
    let tries = 0
    const tick = async () => {
      tries++
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !userData) {
        setSession(session)
        setUser(session.user)
        setLoading(true)
        if (import.meta.env.DEV) console.time('[auth] loadProfile')
        await loadProfile(session)
        if (import.meta.env.DEV) console.timeEnd('[auth] loadProfile')
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
  }, [navigate, userData])

  const hasAccess = useMemo(() => {
    return (key, action = 'view') => {
      const k = normalizeAccessKey(key)
      if (!k) return true
      const r = rights[k]
      if (r === true) return true
      if (typeof r === 'object') return !!r[action]
      return !!r
    }
  }, [rights])

  const value = useMemo(
    () => ({ session, user, userData, loading, hasAccess, ...(userData || {}) }),
    [session, user, userData, loading, hasAccess]
  )

  if (supabaseInitError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold">Configuration error</h1>
          <p className="mb-4 text-red-600">{supabaseInitError}</p>
          <p>
            Please set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> in your environment before
            starting the application.
          </p>
        </div>
      </div>
    )
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export default AuthProvider
export { AuthProvider }
