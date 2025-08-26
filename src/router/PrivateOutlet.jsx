import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function PrivateOutlet() {
  const { session, isAuthenticated } = useAuth()
  if (!(session?.user || isAuthenticated)) return <Navigate to="/login" replace />
  return <Outlet />
}
