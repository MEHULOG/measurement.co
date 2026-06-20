import * as React from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  emptyText = 'No results.',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const selected = options.filter((o) => value.includes(o.value))
  const filtered = options.filter((o) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      o.label.toLowerCase().includes(q) ||
      o.value.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
    )
  })

  function toggle(v: string) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v))
    else onChange([...value, v])
  }

  function remove(v: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(value.filter((x) => x !== v))
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-h-[40px] w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        )}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {o.label}
                <button
                  type="button"
                  onClick={(e) => remove(o.value, e)}
                  className="rounded hover:bg-background/60"
                  aria-label={`Remove ${o.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filtered.map((o) => {
                const checked = value.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent',
                      checked && 'bg-accent/60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-4 w-4 shrink-0 place-items-center rounded border',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1">
                      <div className="font-medium">{o.label}</div>
                      {o.description && (
                        <div className="text-xs text-muted-foreground">
                          {o.description}
                        </div>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
