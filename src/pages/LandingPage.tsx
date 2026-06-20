import { Link } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import {
  Ruler,
  ChartLine,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Github,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ruler className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Measure</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth?mode=sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth?mode=sign-up">
                Sign up <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild size="sm">
              <Link to="/welcome">
                Open app <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1200px] -translate-x-1/2 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New: app creation wizard is live
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Measurement management,
            <br />
            <span className="bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent">
              built for teams that ship.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Capture customer measurements, sync in real-time across your team,
            and generate reports in seconds. Start free — no credit card.
          </p>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SignedOut>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/auth?mode=sign-up">
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link to="/auth?mode=sign-in">I already have an account</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/welcome">
                  Open the app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {[
              'Free forever for small teams',
              'No credit card required',
              'Google sign-in supported',
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard mock */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border bg-card/60 p-2 shadow-2xl backdrop-blur">
            <div className="rounded-xl border bg-background">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                  measure.app/dashboard
                </div>
                <div className="w-12" />
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-4">
                {[
                  { label: 'Total', value: '1,284' },
                  { label: 'Today', value: '32' },
                  { label: 'This month', value: '418' },
                  { label: 'Team', value: '7' },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="text-xs text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="mt-1 text-2xl font-bold">{c.value}</div>
                  </div>
                ))}
                <div className="rounded-lg border bg-card p-4 md:col-span-3">
                  <div className="mb-3 text-xs text-muted-foreground">
                    Last 12 months
                  </div>
                  <div className="flex h-24 items-end gap-1.5">
                    {[40, 60, 35, 80, 55, 70, 90, 75, 95, 65, 85, 100].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-primary/70"
                          style={{ height: `${h}%` }}
                        />
                      ),
                    )}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-xs text-muted-foreground">
                    Recent
                  </div>
                  <ul className="space-y-2 text-xs">
                    {['MES-0421', 'MES-0420', 'MES-0419', 'MES-0418'].map(
                      (id) => (
                        <li
                          key={id}
                          className="flex items-center justify-between"
                        >
                          <span className="font-mono">{id}</span>
                          <span className="text-muted-foreground">just now</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  return (
    <section className="border-y bg-muted/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
          Trusted by teams who care about every millimetre
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-semibold text-muted-foreground/70">
          <span>ACME</span>
          <span>Globex</span>
          <span>Soylent</span>
          <span>Initech</span>
          <span>Massive Dynamic</span>
          <span>Stark Industries</span>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    {
      icon: Zap,
      title: 'Quick capture',
      text: 'Length, width, height with unit pickers — auto IDs, search, filters, pagination out of the box.',
    },
    {
      icon: ChartLine,
      title: 'Live analytics',
      text: 'Daily / weekly / monthly trends pushed via Convex subscriptions — no refresh needed.',
    },
    {
      icon: ShieldCheck,
      title: 'Role-based access',
      text: 'Admins manage users and reports; employees focus on their assigned records.',
    },
    {
      icon: Sparkles,
      title: 'PDF & Excel exports',
      text: 'One-click exports for any date range, customer-ready and styled.',
    },
    {
      icon: Github,
      title: 'GitHub import (soon)',
      text: 'Bring existing projects under management — coming in the next release.',
    },
    {
      icon: Star,
      title: 'Dark & light mode',
      text: 'A polished theme that follows your system preference, no flash on load.',
    },
  ]
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your team needs.
          </h2>
          <p className="mt-3 text-muted-foreground">
            A modern SaaS dashboard with the boring stuff already solved.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: 'Sign up free',
      text: 'Email or Google in seconds — the first user becomes admin.',
    },
    {
      n: 2,
      title: 'Pick your stack',
      text: 'Use the wizard to create a project and choose your tools.',
    },
    {
      n: 3,
      title: 'Capture & report',
      text: 'Add measurements, share with your team, export when ready.',
    },
  ]
  return (
    <section id="how" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in three steps.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No setup. No installs. Sign in and start measuring.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-xl border bg-card p-6"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <SignedOut>
            <Button asChild size="lg">
              <Link to="/auth?mode=sign-up">
                Get started — it&rsquo;s free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild size="lg">
              <Link to="/welcome">
                Open the app <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-primary to-blue-700 p-10 text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Start measuring today.
            </h2>
            <p className="mt-3 text-white/85">
              Sign up free. Invite your team. Cancel any time — we don&rsquo;t
              even ask for a card.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <SignedOut>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
                >
                  <Link to="/auth?mode=sign-up">
                    Create your free account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Link to="/auth?mode=sign-in">Sign in</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link to="/welcome">
                    Open the app <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ruler className="h-4 w-4" />
          </div>
          <span>© {new Date().getFullYear()} Measure</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/auth?mode=sign-in" className="hover:text-foreground">
            Sign in
          </Link>
          <Link to="/auth?mode=sign-up" className="hover:text-foreground">
            Sign up
          </Link>
          <a
            href="#features"
            className="hover:text-foreground"
          >
            Features
          </a>
        </div>
      </div>
    </footer>
  )
}
