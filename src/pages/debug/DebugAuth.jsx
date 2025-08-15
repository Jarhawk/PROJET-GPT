import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugAuth() {
  const { session, userData, loading } = useAuth()
  return (
    <pre style={{padding:16, background:'#111', color:'#0f0', overflow:'auto'}}>
{JSON.stringify({
  loading,
  session: session ? {
    user: {
      id: session.user?.id,
      email: session.user?.email,
      role: session.user?.role
    }
  } : null,
  userData
}, null, 2)}
    </pre>
  )
}
