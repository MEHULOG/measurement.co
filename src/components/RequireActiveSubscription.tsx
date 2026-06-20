import { Navigate, useLocation } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { CenteredSpinner } from '@/components/ui/CenteredSpinner'

/**
 * Wraps the dashboard so users with no active subscription / expired trial
 * are bounced to the billing page. The billing page itself is exempt
 * (passed as a prop) so users can resubscribe.
 */
export function RequireActiveSubscription({
  children,
}: {
  children: React.ReactNode
}) {
  const { data, isLoading } = useSubscription()
  const location = useLocation()
  const isBillingPage = location.pathname.startsWith('/app/billing')

  if (isLoading) return <CenteredSpinner />

  // Still verifying auth or subscription — assume access until we know.
  if (!data) return <>{children}</>

  if (!data.allowed && !isBillingPage) {
    return <Navigate to="/app/billing?reason=expired" replace />
  }
  return <>{children}</>
}
