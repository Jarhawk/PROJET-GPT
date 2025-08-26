import { useAuth as useAuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  return useAuthContext()
}

export default useAuth

/** Hook pratique: renvoie une fonction hasAccess(key, action) */
export function useHasAccess() {
  const auth = useAuthContext()
  return (key?: string | null, action: string = 'view') => {
    return auth?.hasAccess?.(key, action)
  }
}
