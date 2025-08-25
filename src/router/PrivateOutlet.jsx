import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function PrivateOutlet() {
  const auth = useAuth()
  const user = auth?.user
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
