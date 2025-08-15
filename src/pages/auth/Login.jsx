// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import supabase from '@/lib/supabaseClient'
import PageWrapper from '@/components/ui/PageWrapper'
import GlassCard from '@/components/ui/GlassCard'
import MamaLogo from '@/components/ui/MamaLogo'
import PreviewBanner from '@/components/ui/PreviewBanner'

export default function Login() {
  const navigate = useNavigate()
  const { session, userData, loading } = useAuth()
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    const form = e.currentTarget
    const email = form.email?.value?.trim()
    const password = form.password?.value ?? ''
    console.log('[login] submit', { emailPresent: !!email, passwordPresent: !!password })
    setErrorMsg('')
    setPending(true)
    if (!email || !password) {
      setErrorMsg('Veuillez saisir email et mot de passe.')
      setPending(false)
      return
    }
    console.time('[login] signIn')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    console.timeEnd('[login] signIn')
    if (error) {
      console.error('[login] error', error)
      setErrorMsg(error.message || 'Connexion impossible')
      setPending(false)
      return
    }
    setPending(false)
    // Ne pas navigate ici: on attend AuthContext (bootstrap + get_my_profile)
    // L’AuthContext passera loading=false et remplira userData.
  }

  useEffect(() => {
    if (!loading && session && userData) {
      console.info('[login] redirect to /dashboard')
      navigate('/dashboard', { replace: true })
    }
  }, [loading, session, userData, navigate])

  return (
    <PageWrapper>
      <PreviewBanner />
      <GlassCard title="Connexion" className="flex flex-col items-center">
        <div className="mb-6">
          <MamaLogo width={96} />
        </div>
        <p className="text-xs text-white/70 text-center mb-6">
          Plateforme F&B<br />by MamaStock
        </p>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-white/90 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur rounded-md shadow-lg border border-white/20 ring-1 ring-white/20 focus:outline-none hover:bg-white/10"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-white/90 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur rounded-md shadow-lg border border-white/20 ring-1 ring-white/20 focus:outline-none hover:bg-white/10"
            />
          </div>
          {errorMsg ? <div role="alert" className="text-sm text-red-500">{errorMsg}</div> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Connexion…' : 'Login'}
          </button>
          <div className="text-right mt-2">
            <Link to="/reset-password" className="text-xs text-gold hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </GlassCard>
      <p className="text-xs text-center text-white/40 mt-4">© MamaStock 2025</p>
    </PageWrapper>
  )
}
