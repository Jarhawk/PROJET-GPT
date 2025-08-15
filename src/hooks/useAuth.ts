import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import { normalizeAccessKey } from '@/lib/access'

export function useAuth() {
  return useAuthContext()
}

/** Hook pratique: renvoie une fonction hasAccess(key) */
export function useHasAccess() {
  const { userData } = useAuthContext()
  const rights = userData?.access_rights ?? {}
  return (key?: string | null) => {
    const k = normalizeAccessKey(key)
    if (!k) return true
    return !!rights[k]
  }
}
