import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAction, useMutation } from 'convex/react'
import { toast } from 'sonner'
import {
  Check,
  Clock,
  CreditCard,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useSubscription } from '@/hooks/useSubscription'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PLAN_CARDS = [
  {
    id: 'pro_monthly' as const,
    name: 'Pro Monthly',
    price: '$19',
    priceSuffix: '/month',
    description: 'Everything you need to manage measurements.',
    features: [
      'Unlimited measurements',
      'PDF & Excel exports',
      'Camera measurement tool',
      'Realtime team sync',
      'Email support',
    ],
    highlight: false,
  },
  {
    id: 'pro_yearly' as const,
    name: 'Pro Yearly',
    price: '$190',
    priceSuffix: '/year',
    description: 'Two months free. Best for committed teams.',
    features: [
      'Everything in Pro Monthly',
      '2 months free vs monthly',
      'Priority email support',
      'Quarterly account review',
    ],
    highlight: true,
  },
]

export default function BillingPage() {
  const [params] = useSearchParams()
  const reason = params.get('reason')
  const demoSuccess = params.get('demo') === 'success'

  const { data, isLoading } = useSubscription()
  const startCheckout = useAction(api.billing.startCheckout)
  const cancel = useMutation(api.billing.cancel)
  const dev_expire = useMutation(api.billing.dev_expireTrial)
  const dev_reset = useMutation(api.billing.dev_resetTrial)

  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (demoSuccess) toast.success('Subscription activated (demo mode)')
  }, [demoSuccess])

  async function handleSubscribe(plan: 'pro_monthly' | 'pro_yearly') {
    setCheckingOut(plan)
    try {
      const result = await startCheckout({ plan })
      if (result.mode === 'stripe') {
        window.location.href = result.url
      } else {
        toast.success('Demo subscription activated')
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
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, view trial status, and pick a plan.
        </p>
      </div>

      {reason === 'expired' && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <div className="font-semibold text-destructive">
                Your trial has ended
              </div>
              <p className="text-muted-foreground">
                Pick a plan below to keep using the app.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <StatusBadge data={data} />
                <div className="text-sm">
                  <div className="font-medium">
                    {data.reason === 'active' && data.plan === 'pro_yearly'
                      ? 'Pro Yearly'
                      : data.reason === 'active' && data.plan === 'pro_monthly'
                        ? 'Pro Monthly'
                        : data.reason === 'trialing'
                          ? '3-day free trial'
                          : 'No active subscription'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.reason === 'trialing' && data.trialEndsAt
                      ? `Trial ends ${formatDate(data.trialEndsAt)}`
                      : data.reason === 'active' && data.currentPeriodEndsAt
                        ? `Renews ${formatDate(data.currentPeriodEndsAt)}`
                        : 'Pick a plan below to restore access.'}
                  </div>
                </div>
              </div>
              {data.reason === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel subscription
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLAN_CARDS.map((p) => {
          const active = data?.reason === 'active' && data.plan === p.id
          return (
            <Card
              key={p.id}
              className={cn(
                'relative flex flex-col',
                p.highlight && 'border-primary shadow-md ring-1 ring-primary/30',
              )}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Best value
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {active && (
                    <Badge variant="success">
                      <Check className="mr-1 h-3 w-3" />
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{p.description}</CardDescription>
                <div className="pt-2 text-3xl font-bold">
                  {p.price}
                  <span className="text-base font-normal text-muted-foreground">
                    {p.priceSuffix}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto"
                  disabled={!!checkingOut || active}
                  onClick={() => handleSubscribe(p.id)}
                >
                  {active ? (
                    <>
                      <Check className="h-4 w-4" /> Active
                    </>
                  ) : checkingOut === p.id ? (
                    'Processing…'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Subscribe
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dev controls */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Developer tools
          </CardTitle>
          <CardDescription>
            Shortcuts for testing — without these you&rsquo;d need to wait 3
            days for the trial to expire naturally.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await dev_expire()
              toast.success('Trial expired')
            }}
          >
            <Clock className="h-4 w-4" /> Expire trial now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await dev_reset()
              toast.success('Trial reset to 3 days')
            }}
          >
            Reset trial (3 days)
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel subscription?"
        description="You'll lose access at the end of the current billing period. You can resubscribe at any time."
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

function StatusBadge({
  data,
}: {
  data: { reason: 'active' | 'trialing' | 'expired' | 'cancelled' | 'past_due' }
}) {
  switch (data.reason) {
    case 'active':
      return (
        <Badge variant="success" className="px-3 py-1">
          <Sparkles className="mr-1 h-3 w-3" />
          Active
        </Badge>
      )
    case 'trialing':
      return (
        <Badge className="bg-primary/15 px-3 py-1 text-primary">
          <Clock className="mr-1 h-3 w-3" />
          Trial
        </Badge>
      )
    default:
      return (
        <Badge variant="destructive" className="px-3 py-1">
          {data.reason}
        </Badge>
      )
  }
}
