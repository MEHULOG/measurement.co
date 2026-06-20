import { Link } from 'react-router-dom'
import { Ruler } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
            <Ruler className="h-3.5 w-3.5" />
          </div>
          <span>© {new Date().getFullYear()} Measure. All rights reserved.</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms &amp; Conditions
          </Link>
          <span aria-hidden className="h-3 w-px bg-border" />
          <Link
            to="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
