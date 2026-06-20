import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { CenteredSpinner } from '@/components/ui/CenteredSpinner'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser()
  if (isLoading) return <CenteredSpinner />
  if (!user || user.role !== 'admin')
    return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}
