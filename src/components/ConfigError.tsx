import { AlertTriangle, ExternalLink } from 'lucide-react'

interface ConfigErrorProps {
  title: string
  description: string
  hint?: string
  steps?: string[]
}

export function ConfigError({
  title,
  description,
  hint,
  steps,
}: ConfigErrorProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
            {hint && (
              <p className="text-sm text-muted-foreground">{hint}</p>
            )}
          </div>
        </div>

        {steps && steps.length > 0 && (
          <ol className="mt-4 space-y-2 rounded-md bg-muted p-4 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-accent"
            href="https://dashboard.clerk.com/last-active?path=api-keys"
            target="_blank"
            rel="noreferrer"
          >
            Clerk dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-accent"
            href="https://dashboard.convex.dev"
            target="_blank"
            rel="noreferrer"
          >
            Convex dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
