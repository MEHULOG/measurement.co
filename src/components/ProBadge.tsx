import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Visual marker for active Pro subscribers. Renders a gold crown chip;
 * with showLabel=false it's just the icon (handy in compact contexts).
 */
export function ProBadge({
  size = 'sm',
  showLabel = true,
  className,
}: ProBadgeProps) {
  const sizes = {
    sm: 'h-5 px-1.5 text-[10px]',
    md: 'h-6 px-2 text-xs',
    lg: 'h-7 px-2.5 text-sm',
  }
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }
  return (
    <span
      title="Pro subscriber"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-400/20 to-amber-500/10 font-semibold uppercase tracking-wide text-amber-700 shadow-sm dark:text-amber-300',
        sizes[size],
        className,
      )}
    >
      <Crown className={cn('fill-amber-400 text-amber-500', iconSizes[size])} />
      {showLabel && <span>Pro</span>}
    </span>
  )
}
