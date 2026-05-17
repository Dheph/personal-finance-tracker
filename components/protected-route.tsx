'use client'

import { useAuth } from '@/contexts/auth-context'
import { LoginPage } from '@/components/login-page'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isConfigured } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isConfigured && !user) {
    return <LoginPage />
  }

  return <>{children}</>
}
