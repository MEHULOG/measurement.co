import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { Ruler, ChartLine, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'sign-in' | 'sign-up'

export default function AuthPage() {
  const [params, setParams] = useSearchParams()
  const initial = (params.get('mode') as Mode) ?? 'sign-in'
  const [mode, setMode] = useState<Mode>(
    initial === 'sign-up' ? 'sign-up' : 'sign-in',
  )

  const switchTo = (m: Mode) => {
    setMode(m)
    setParams({ mode: m }, { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branded side panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700 p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-white blur-3xl" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-white/15 backdrop-blur">
            <Ruler className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Measure</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Measurement management,
              <br />
              made simple.
            </h1>
            <p className="mt-3 max-w-md text-white/80">
              Capture customer measurements, sync in real-time across your
              team, and ship reports in seconds.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              {
                icon: Sparkles,
                title: 'Quick capture',
                text: 'Length, width, height with unit pickers — built for the field.',
              },
              {
                icon: ChartLine,
                title: 'Live analytics',
                text: 'Daily, weekly, monthly trends pushed via Convex.',
              },
              {
                icon: ShieldCheck,
                title: 'Role-based',
                text: 'Admins manage users; employees focus on their work.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-white/75">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} Measure · Built with Convex + Clerk
        </div>
      </aside>

      {/* Auth panel */}
      <main className="flex flex-col bg-background">
        {/* Mobile brand */}
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Ruler className="h-5 w-5" />
            </div>
            <span className="font-semibold">Measure</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'sign-in'
                  ? 'Sign in to continue to your dashboard.'
                  : 'Get started in seconds — no credit card required.'}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="grid grid-cols-2 rounded-lg border bg-muted p-1">
              <TabButton
                active={mode === 'sign-in'}
                onClick={() => switchTo('sign-in')}
              >
                Sign in
              </TabButton>
              <TabButton
                active={mode === 'sign-up'}
                onClick={() => switchTo('sign-up')}
              >
                Sign up
              </TabButton>
            </div>

            {/* Clerk widget */}
            <div className="flex justify-center">
              {mode === 'sign-in' ? (
                <SignIn
                  routing="virtual"
                  signUpUrl="/auth?mode=sign-up"
                  afterSignInUrl="/welcome"
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp
                  routing="virtual"
                  signInUrl="/auth?mode=sign-in"
                  afterSignUpUrl="/welcome"
                  appearance={clerkAppearance}
                />
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'sign-in' ? (
                <>
                  Don&rsquo;t have an account?{' '}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => switchTo('sign-up')}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => switchTo('sign-in')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

const clerkAppearance = {
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border-0 bg-transparent p-0 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    footer: 'hidden',
    socialButtonsBlockButton:
      'border border-input bg-background hover:bg-accent text-foreground',
    formButtonPrimary:
      'bg-primary text-primary-foreground hover:bg-primary/90 normal-case',
    formFieldInput:
      'border border-input bg-background focus:ring-2 focus:ring-ring',
    formFieldLabel: 'text-foreground',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
    identityPreviewEditButton: 'text-primary',
    formResendCodeLink: 'text-primary',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
}
