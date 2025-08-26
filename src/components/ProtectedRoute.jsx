import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ accessKey, children }) {
  const { session, userData, loading, isAuthenticated } = useAuth()
  if (loading) return null
  if (!(session?.user || isAuthenticated)) return <Navigate to="/login" replace />
  if (accessKey) {
    const rights = userData?.access_rights || {}
    if (!rights[accessKey]?.peut_voir) {
      return <Navigate to="/unauthorized" replace />
    }
  }
  return children
}
