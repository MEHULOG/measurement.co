import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useConvexAuth, useQuery } from 'convex/react'
import { UserButton } from '@clerk/clerk-react'
import {
  Sparkles,
  Github,
  Ruler,
  ArrowRight,
  Clock,
  ChevronLeft,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { UserBootstrap } from '@/components/UserBootstrap'
import { AppWizard } from '@/components/AppWizard'
import { AuthDebug } from '@/components/AuthDebug'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function WelcomePage() {
  const [params, setParams] = useSearchParams()
  const action = params.get('action')
  const wizardOpen = action === 'new'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <UserBootstrap />
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <AuthDebug />
        {wizardOpen ? (
          <WizardWrapper onCancel={() => setParams({}, { replace: true })} />
        ) : (
          <ChoicesView
            onNew={() => setParams({ action: 'new' }, { replace: true })}
          />
        )}
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ruler className="h-5 w-5" />
          </div>
          <span className="font-semibold">Measure</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/dashboard">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}

function WizardWrapper({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to options
      </button>
      <AppWizard onCancel={onCancel} />
    </div>
  )
}

function ChoicesView({ onNew }: { onNew: () => void }) {
  const { user } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()
  // Skip the query until Convex has accepted the Clerk token — otherwise we
  // burn a server error on every render before the auth handshake completes.
  const myApps = useQuery(api.apps.myApps, isAuthenticated ? {} : 'skip')
  const [hovered, setHovered] = useState<'new' | 'import' | null>(null)
  const navigate = useNavigate()

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {user ? `Welcome, ${user.name.split(' ')[0]} 👋` : 'Welcome 👋'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Let&rsquo;s get your next project off the ground. What would you like
          to do?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceCard
          icon={Sparkles}
          title="Create a new app"
          description="Start from scratch — pick a stack and we'll scaffold the project for you."
          ctaLabel="Get started"
          onClick={onNew}
          active={hovered === 'new'}
          onHover={() => setHovered('new')}
          onLeave={() => setHovered(null)}
        />
        <ChoiceCard
          icon={Github}
          title="Import from GitHub"
          description="Connect a repository and bring your existing project under management."
          ctaLabel="Coming soon"
          disabled
          badge="Coming soon"
          onHover={() => setHovered('import')}
          onLeave={() => setHovered(null)}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your apps</h2>
          <Button variant="ghost" size="sm" onClick={onNew}>
            <Sparkles className="h-4 w-4" /> New app
          </Button>
        </div>
        {myApps === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : myApps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Clock className="h-6 w-6" />
              <p className="text-sm">
                You haven&rsquo;t created any apps yet. Try the wizard above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myApps.map((app) => (
              <Card
                key={app._id}
                className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/40"
                onClick={() => navigate(`/app/dashboard?app=${app._id}`)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{app.name}</div>
                    <Badge variant="secondary" className="capitalize">
                      {app.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(app.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onClick,
  disabled,
  badge,
  active,
  onHover,
  onLeave,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  ctaLabel: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
  active?: boolean
  onHover?: () => void
  onLeave?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        'group relative flex h-full flex-col items-start gap-4 rounded-xl border bg-card p-6 text-left shadow-sm transition-all',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        active && !disabled && 'border-primary/40',
      )}
    >
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
          {badge}
        </span>
      )}
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          'mt-auto inline-flex items-center gap-1 text-sm font-medium',
          disabled ? 'text-muted-foreground' : 'text-primary',
        )}
      >
        {ctaLabel}
        {!disabled && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </button>
  )
}
