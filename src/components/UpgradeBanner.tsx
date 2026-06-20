import { useState } from 'react'
import { Sparkles, X, Crown, ArrowRight } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { usePolarCheckout } from '@/hooks/usePolarCheckout'

/**
 * Full-width banner that sits above the topbar when the user doesn't have
 * an active paid subscription. Shown in two flavors:
 *   - Trialing  — friendly nudge with days remaining
 *   - Expired   — destructive-tinted, "you've lost access" call-to-action
 *
 * Disappears entirely once subscription is active.
 *
 * Dismissable only in the trialing state (sessionStorage-backed) — when the
 * trial expires the banner returns regardless.
 */
export function UpgradeBanner() {
  const { data } = useSubscription()
  const { open, opening } = usePolarCheckout()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('upgrade-banner-dismissed') === '1',
  )

  if (!data) return null
  if (data.reason === 'active') return null

  const expired = data.reason !== 'trialing'
  if (!expired && dismissed) return null

  const daysLeft = Math.max(0, Math.ceil(data.msRemaining / 86_400_000))
  const isUrgent = expired || data.msRemaining < 24 * 60 * 60 * 1000

  return (
    <div
      className={`relative flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-gradient-to-r from-destructive to-rose-600 text-white'
          : 'bg-gradient-to-r from-primary to-blue-600 text-primary-foreground'
      }`}
    >
      <Crown className="hidden h-4 w-4 shrink-0 sm:block" />
      <span className="flex-1 text-center sm:flex-initial">
        {expired ? (
          <>
            <strong>Your trial has ended.</strong> Subscribe to keep using the
            camera tool, orders, and full reports.
          </>
        ) : (
          <>
            <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</strong> in
            your free trial — upgrade now to unlock unlimited measurements,
            camera, and exports.
          </>
        )}
      </span>
      <button
        type="button"
        onClick={() => open('pro_monthly')}
        disabled={!!opening}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
          isUrgent
            ? 'bg-white text-destructive hover:bg-white/90'
            : 'bg-white text-primary hover:bg-white/90'
        } disabled:opacity-60`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {opening ? 'Opening…' : 'Upgrade to Pro'}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      {!expired && (
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('upgrade-banner-dismissed', '1')
            setDismissed(true)
          }}
          className="shrink-0 rounded-md p-1 opacity-70 hover:bg-white/20 hover:opacity-100"
          aria-label="Dismiss"
          title="Dismiss for this session"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
