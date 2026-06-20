import { Link } from 'react-router-dom'
import { ArrowLeft, Ruler } from 'lucide-react'
import { Footer } from '@/components/Footer'

interface LegalLayoutProps {
  title: string
  updated: string
  children: React.ReactNode
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Ruler className="h-4 w-4" />
            </div>
            <span className="font-semibold">Measure</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {updated}
          </p>
        </div>
        <article className="prose prose-sm max-w-none space-y-4 text-foreground [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:mb-1 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </article>
      </main>

      <Footer />
    </div>
  )
}
