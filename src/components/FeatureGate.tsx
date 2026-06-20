import { ReactNode } from 'react'
import { Lock, Sparkles, Crown, Check } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { usePolarCheckout } from '@/hooks/usePolarCheckout'
import { Button } from '@/components/ui/Button'
import { CenteredSpinner } from '@/components/ui/CenteredSpinner'
import { cn } from '@/lib/utils'

interface FeatureGateProps {
  /**
   * What the user is being blocked from. Shown in the "Upgrade to unlock X"
   * headline.
   */
  feature: string
  /**
   * Short pitch — why this is worth paying for. Appears under the headline.
   */
  description: string
  /**
   * 2–4 bullet points listing what they get.
   */
  benefits?: string[]
  /**
   * The locked content — rendered (and blurred behind the overlay) so the
   * user can see what they're missing. When the user has access, this is
   * rendered cleanly without the overlay.
   */
  children: ReactNode
  /**
   * Trial users (`reason: 'trialing'`) currently *do* have access — set to
   * `true` to require an active paid plan even during the trial.
   */
  requirePaid?: boolean
}

/**
 * Wraps a feature in a paywall overlay. The underlying content is rendered
 * blurred behind a "Subscribe to unlock" card with a button that opens the
 * Polar embedded checkout. When the subscription is active, the overlay
 * disappears and the children render normally.
 */
export function FeatureGate({
  feature,
  description,
  benefits,
  children,
  requirePaid,
}: FeatureGateProps) {
  const { data, isLoading } = useSubscription()
  const { open, opening } = usePolarCheckout()

  if (isLoading) return <CenteredSpinner />

  const allowed =
    data?.allowed &&
    (!requirePaid || data.reason === 'active')

  if (allowed) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Blurred / dimmed underlying content */}
      <div
        aria-hidden
        className="pointer-events-none select-none opacity-40 blur-[3px]"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center p-6',
          'bg-background/60 backdrop-blur-sm',
        )}
      >
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-600 dark:text-amber-300">
              <Crown className="h-6 w-6 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Upgrade to unlock {feature}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pro · $19/mo or $190/yr
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{description}</p>

          {benefits && benefits.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => open('pro_monthly')}
              disabled={!!opening}
            >
              <Sparkles className="h-4 w-4" />
              {opening === 'pro_monthly'
                ? 'Opening checkout…'
                : 'Go Pro — $19/mo'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => open('pro_yearly')}
              disabled={!!opening}
            >
              {opening === 'pro_yearly' ? 'Opening…' : 'Pro Yearly — $190'}
            </Button>
          </div>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Cancel anytime · Secure payment via Polar
          </p>
        </div>
      </div>
    </div>
  )
}
