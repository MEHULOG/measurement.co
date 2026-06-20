import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  // Don't fire `users.me` until Convex has accepted the Clerk JWT, otherwise
  // every page renders a `Not authenticated` server error in the console.
  const user = useQuery(api.users.me, isAuthenticated ? {} : 'skip')
  return {
    user,
    isLoading: authLoading || (isAuthenticated && user === undefined),
  }
}
