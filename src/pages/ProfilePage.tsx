import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserProfile } from '@clerk/clerk-react'
import { useAction, useMutation } from 'convex/react'
import { toast } from 'sonner'
import {
  Clock,
  CreditCard,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProBadge } from '@/components/ProBadge'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSubscription } from '@/hooks/useSubscription'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useCurrentUser()
  const { data: sub, isLoading: subLoading } = useSubscription()
  const startCheckout = useAction(api.billing.startCheckout)
  const cancel = useMutation(api.billing.cancel)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const isPro = sub?.reason === 'active'

  async function handleSubscribe(plan: 'pro_monthly' | 'pro_yearly') {
    setCheckingOut(plan)
    try {
      const result = await startCheckout({ plan })
      if (result.mode === 'stripe') {
        window.location.href = result.url
      } else {
        toast.success('Subscription activated')
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Checkout failed')
    } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, subscription, and security.
        </p>
      </div>

      {/* Workspace details — Pro badge inline with name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace details</CardTitle>
          <CardDescription>
            Information from your Convex user record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="flex items-center gap-2 font-medium">
                  {user.name}
                  {isPro && <ProBadge size="sm" />}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                  >
                    {user.role}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd className="font-medium">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Subscription section */}
      <Card
        className={
          isPro
            ? 'border-amber-400/40 bg-gradient-to-br from-amber-50/40 to-transparent dark:from-amber-950/20'
            : undefined
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Subscription
            {isPro && <ProBadge size="sm" />}
          </CardTitle>
          <CardDescription>
            View your current plan, upgrade, or manage your billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subLoading || !sub ? (
            <Skeleton className="h-16 w-full" />
          ) : sub.reason === 'active' ? (
            <ActiveSubscriptionRow
              plan={sub.plan}
              renewsAt={sub.currentPeriodEndsAt}
              onCancel={() => setCancelOpen(true)}
            />
          ) : sub.reason === 'trialing' ? (
            <TrialingRow
              trialEndsAt={sub.trialEndsAt}
              msRemaining={sub.msRemaining}
              onSubscribe={handleSubscribe}
              checkingOut={checkingOut}
            />
          ) : (
            <ExpiredRow
              reason={sub.reason}
              onSubscribe={handleSubscribe}
              checkingOut={checkingOut}
            />
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/billing">
                Open billing page <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clerk profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Powered by Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <UserProfile routing="hash" />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel subscription?"
        description="You'll lose Pro access at the end of the current billing period."
        destructive
        confirmText="Cancel subscription"
        onConfirm={async () => {
          try {
            await cancel()
            toast.success('Subscription cancelled')
          } catch (e: any) {
            toast.error(e?.message ?? 'Failed to cancel')
          }
        }}
      />
    </div>
  )
}

function ActiveSubscriptionRow({
  plan,
  renewsAt,
  onCancel,
}: {
  plan: 'pro_monthly' | 'pro_yearly' | null
  renewsAt: number | null
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-semibold">
            {plan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly'}
            <ProBadge size="sm" showLabel={false} />
          </div>
          <div className="text-xs text-muted-foreground">
            {renewsAt ? `Renews ${formatDate(renewsAt)}` : 'Active'}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

function TrialingRow({
  trialEndsAt,
  msRemaining,
  onSubscribe,
  checkingOut,
}: {
  trialEndsAt: number | null
  msRemaining: number
  onSubscribe: (plan: 'pro_monthly' | 'pro_yearly') => void
  checkingOut: string | null
}) {
  const days = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
  return (
    <div className="space-y-3 rounded-lg border bg-card/60 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">3-day free trial</div>
          <div className="text-xs text-muted-foreground">
            {days} day{days === 1 ? '' : 's'} left
            {trialEndsAt && ` · ends ${formatDate(trialEndsAt)}`}
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={!!checkingOut}
          onClick={() => onSubscribe('pro_monthly')}
        >
          {checkingOut === 'pro_monthly' ? 'Processing…' : 'Go Pro — $19/mo'}
        </Button>
        <Button
          variant="secondary"
          disabled={!!checkingOut}
          onClick={() => onSubscribe('pro_yearly')}
        >
          {checkingOut === 'pro_yearly'
            ? 'Processing…'
            : 'Pro Yearly — $190 (save 2 months)'}
        </Button>
      </div>
    </div>
  )
}

function ExpiredRow({
  reason,
  onSubscribe,
  checkingOut,
}: {
  reason: 'expired' | 'cancelled' | 'past_due'
  onSubscribe: (plan: 'pro_monthly' | 'pro_yearly') => void
  checkingOut: string | null
}) {
  const label =
    reason === 'cancelled'
      ? 'Your subscription has been cancelled.'
      : reason === 'past_due'
        ? 'Your last payment failed.'
        : 'Your free trial has ended.'
  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-destructive">{label}</div>
          <div className="text-xs text-muted-foreground">
            Pick a plan to restore access.
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={!!checkingOut}
          onClick={() => onSubscribe('pro_monthly')}
        >
          {checkingOut === 'pro_monthly' ? 'Processing…' : 'Pro Monthly — $19'}
        </Button>
        <Button
          variant="secondary"
          disabled={!!checkingOut}
          onClick={() => onSubscribe('pro_yearly')}
        >
          {checkingOut === 'pro_yearly'
            ? 'Processing…'
            : 'Pro Yearly — $190'}
        </Button>
      </div>
    </div>
  )
}
