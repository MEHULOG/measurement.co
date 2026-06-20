import { Link } from 'react-router-dom'
import { Clock, Crown } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

function formatRemaining(ms: number) {
  if (ms <= 0) return 'expired'
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days >= 1) return `${days}d ${hours}h left`
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (hours >= 1) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

export function TrialBadge() {
  const { data } = useSubscription()
  if (!data) return null

  if (data.reason === 'trialing') {
    const urgent = data.msRemaining < 24 * 60 * 60 * 1000
    return (
      <Link
        to="/app/billing"
        className={cn(
          'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:inline-flex',
          urgent
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300'
            : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20',
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        Trial · {formatRemaining(data.msRemaining)}
      </Link>
    )
  }
  if (data.reason === 'active') {
    return (
      <Link
        to="/app/billing"
        title="Pro subscription active"
        className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-400/20 to-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 shadow-sm transition-colors hover:from-amber-400/30 hover:to-amber-500/20 dark:text-amber-300"
      >
        <Crown className="h-3 w-3 fill-amber-400 text-amber-500" />
        Pro
      </Link>
    )
  }
  return (
    <Link
      to="/app/billing"
      className="hidden items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 sm:inline-flex"
    >
      Subscription required
    </Link>
  )
}
