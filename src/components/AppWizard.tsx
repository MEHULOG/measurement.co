import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Smartphone,
  Monitor,
  Sparkles,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { MultiSelect } from '@/components/ui/MultiSelect'
import {
  EMPTY_STACK,
  STACK_FIELDS,
  StackSelection,
  labelFor,
} from '@/lib/techCatalog'
import { cn } from '@/lib/utils'

type AppType = 'web' | 'mobile' | 'desktop'

const TYPE_CARDS: {
  value: AppType
  label: string
  description: string
  icon: typeof Globe
}[] = [
  {
    value: 'web',
    label: 'Web',
    description: 'Browser-based SaaS, dashboards, marketing sites.',
    icon: Globe,
  },
  {
    value: 'mobile',
    label: 'Mobile',
    description: 'iOS and Android apps — native or cross-platform.',
    icon: Smartphone,
  },
  {
    value: 'desktop',
    label: 'Desktop',
    description: 'macOS, Windows, Linux apps.',
    icon: Monitor,
  },
]

export function AppWizard({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  const createApp = useMutation(api.apps.create)
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [type, setType] = useState<AppType>('web')
  const [stack, setStack] = useState<StackSelection>(EMPTY_STACK)
  const [submitting, setSubmitting] = useState(false)

  const trimmedName = name.trim()
  const canProceedStep1 = trimmedName.length > 0
  const stackTotal = useMemo(
    () => Object.values(stack).reduce((n, arr) => n + arr.length, 0),
    [stack],
  )

  async function handleCreate() {
    if (!canProceedStep1) return
    setSubmitting(true)
    try {
      const id = await createApp({
        name: trimmedName,
        type,
        stack,
        source: 'blank',
      })
      toast.success(`App "${trimmedName}" created`)
      navigate(`/app/dashboard?newApp=${id}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create app')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Stepper step={step} />

      {step === 1 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-xl font-semibold">Name your app</h2>
              <p className="text-sm text-muted-foreground">
                You can change this later.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-name">App name</Label>
              <Input
                id="app-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme CRM"
                autoFocus
                maxLength={80}
              />
            </div>

            <div>
              <Label className="mb-2 block">Project type</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {TYPE_CARDS.map((t) => {
                  const Icon = t.icon
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        'group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                        active
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'hover:border-primary/40 hover:bg-accent',
                      )}
                    >
                      <div
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-md',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-xl font-semibold">Pick your stack</h2>
              <p className="text-sm text-muted-foreground">
                Optional — choose any combination, or skip and decide later.
              </p>
            </div>

            <div className="space-y-4">
              {STACK_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label>{field.label}</Label>
                    <span className="text-xs text-muted-foreground">
                      {field.description}
                    </span>
                  </div>
                  <MultiSelect
                    options={field.options}
                    value={stack[field.key]}
                    onChange={(next) =>
                      setStack((s) => ({ ...s, [field.key]: next }))
                    }
                    placeholder={`Search ${field.label.toLowerCase()}…`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Skip
                </Button>
                <Button onClick={() => setStep(3)}>
                  {stackTotal > 0
                    ? `Continue (${stackTotal})`
                    : 'Continue'}{' '}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-xl font-semibold">Review &amp; create</h2>
              <p className="text-sm text-muted-foreground">
                Take a quick look — you can edit everything later.
              </p>
            </div>

            <dl className="space-y-3 rounded-lg border bg-muted/40 p-4 text-sm">
              <Row label="Name">
                <span className="font-medium">{trimmedName}</span>
              </Row>
              <Row label="Type">
                <span className="capitalize">{type}</span>
              </Row>
              {STACK_FIELDS.map((field) => {
                const values = stack[field.key]
                return (
                  <Row key={field.key} label={field.label}>
                    {values.length === 0 ? (
                      <span className="text-muted-foreground">
                        Not selected
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {values.map((v) => (
                          <span
                            key={v}
                            className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {labelFor(field.options, v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </Row>
                )
              })}
            </dl>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create app'}{' '}
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const steps = ['Name & type', 'Stack', 'Review']
  return (
    <ol className="flex items-center justify-center gap-2 text-sm">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <li key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold',
                done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : active
                    ? 'border-primary text-primary'
                    : 'border-input text-muted-foreground',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span
              className={cn(
                'hidden sm:inline',
                active ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {n < steps.length && (
              <span className="mx-2 h-px w-8 bg-border sm:w-12" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-32 shrink-0 text-xs uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1">{children}</dd>
    </div>
  )
}
