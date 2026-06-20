import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/clerk-react'

/**
 * Ensures a `users` row exists in Convex for the signed-in Clerk user.
 * Runs once per page load.
 */
export function UserBootstrap() {
  const store = useMutation(api.users.store)
  const { isLoaded, isSignedIn } = useUser()
  const done = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || done.current) return
    done.current = true
    store().catch((e) => console.error('User bootstrap failed:', e))
  }, [isLoaded, isSignedIn, store])

  return null
}
