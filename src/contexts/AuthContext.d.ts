declare module '@/contexts/AuthContext' {
  interface AuthContextValue {
    session?: any
    userData?: { access_rights?: Record<string, unknown> } | null
    loading?: boolean
    hasAccess?: (key?: string | null, action?: string) => boolean
    [key: string]: any
  }
  export function useAuth(): AuthContextValue | null
  export const AuthProvider: React.ComponentType<React.PropsWithChildren<unknown>>
  export default AuthProvider
}
