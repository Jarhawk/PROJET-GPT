declare module '@/contexts/AuthContext' {
  interface AuthContextValue {
    session?: any
    mama_id?: string | null
    access_rights?: Record<string, unknown> | null
    loading?: boolean
    pending?: boolean
    isSuperadmin?: boolean
    hasAccess?: (module?: string | null, right?: string | null) => boolean
    [key: string]: any
  }
  export default function AuthProvider(props: React.PropsWithChildren<unknown>): JSX.Element
  export function useAuth(): AuthContextValue
}
