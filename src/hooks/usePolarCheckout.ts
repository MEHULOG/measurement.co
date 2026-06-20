import { useCallback, useState } from 'react'
import { useAction } from 'convex/react'
import { toast } from 'sonner'
import { PolarEmbedCheckout } from '@polar-sh/checkout/embed'
import { useTheme } from '@/lib/theme'
import { api } from '../../convex/_generated/api'

/**
 * Opens the Polar embedded-checkout iframe for the given plan.
 *
 * Flow:
 *   1. Call the Convex `billing.startCheckout` action to create a Checkout
 *      Session and get its embeddable URL.
 *   2. Open that URL in PolarEmbedCheckout.
 *   3. On `success` event, the Convex webhook will already have (or shortly
 *      will) flip subscriptionStatus → 'active'. The `billing.status` query
 *      auto-refreshes via Convex's reactive subscriptions, so UI updates by
 *      itself.
 *
 * If Polar credentials aren't configured on the Convex deployment, the
 * action returns `mode: 'demo'` and we activate locally instead of opening
 * the iframe — keeps the flow testable end-to-end without a Polar account.
 */
export function usePolarCheckout() {
  const startCheckout = useAction(api.billing.startCheckout)
  const { resolvedTheme } = useTheme()
  const [opening, setOpening] = useState<string | null>(null)

  const open = useCallback(
    async (plan: 'pro_monthly' | 'pro_yearly') => {
      setOpening(plan)
      try {
        const result = await startCheckout({ plan })
        if (result.mode === 'demo') {
          toast.success('Subscription activated (demo mode — Polar not configured)')
          return { mode: 'demo' as const }
        }
        const checkout = await PolarEmbedCheckout.create(result.url, {
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        })
        checkout.addEventListener('success', () => {
          toast.success('Welcome to Pro! Your subscription is active.')
        })
        return { mode: 'polar' as const, checkoutId: result.checkoutId }
      } catch (e: any) {
        toast.error(e?.message ?? 'Checkout failed to open')
        return null
      } finally {
        setOpening(null)
      }
    },
    [startCheckout, resolvedTheme],
  )

  return { open, opening }
}
