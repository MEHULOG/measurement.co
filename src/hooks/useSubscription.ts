import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

/**
 * Convenience accessor for the current user's subscription status.
 * `data === undefined` while loading; `null` when not authenticated.
 */
export function useSubscription() {
  const { isAuthenticated } = useConvexAuth()
  const data = useQuery(api.billing.status, isAuthenticated ? {} : 'skip')
  return {
    data: data ?? null,
    isLoading: isAuthenticated && data === undefined,
  }
}
