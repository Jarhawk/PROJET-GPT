import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function PrivateOutlet() {
  const { session, userData, loading } = useAuth()
  if (loading || (session && !userData)) return null // pas de faux unauthorized pendant chargement
  if (!session) return <Navigate to="/login" replace />
  if (!userData) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
