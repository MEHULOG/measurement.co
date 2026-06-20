import { useMemo, useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
  Camera,
  Pencil,
  ArrowRight,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  MeasurementForm,
  MeasurementFormValues,
} from '@/components/MeasurementForm'
import { CameraMeasure } from '@/components/CameraMeasure'
import { formatDateShort } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'
import type { MeasurementWithUsers } from '@/types'

const PAGE_SIZE = 8

type Mode = null | 'camera' | 'form'

/**
 * Stripped-down Measurements page: two big actions only.
 *  • "Measure with camera" → inline reference-scaled capture, then
 *    pre-fills the measurement form.
 *  • "Write a measurement" → opens the manual form directly.
 * Listing / filtering / deletion live on the dashboard now.
 */
export default function MeasurementsPage() {
  const { user } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()
  const [mode, setMode] = useState<Mode>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MeasurementWithUsers | null>(null)
  const [deleting, setDeleting] = useState<MeasurementWithUsers | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [prefill, setPrefill] = useState<{
    length: number
    at: number
  } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const create = useMutation(api.measurements.create)
  const update = useMutation(api.measurements.update)
  const remove = useMutation(api.measurements.remove)

  // List of measurements created (this user's, or all if admin)
  const data = useQuery(
    api.measurements.list,
    isAuthenticated ? { search: search || undefined } : 'skip',
  ) as MeasurementWithUsers[] | undefined

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE))
  const paged = useMemo(
    () => data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [],
    [data, page],
  )

  const canEdit = (m: MeasurementWithUsers) =>
    user?.role === 'admin' || m.createdBy === user?._id

  async function handleSubmit(values: MeasurementFormValues) {
    setSubmitting(true)
    try {
      await create(values)
      toast.success('Measurement saved')
      setFormOpen(false)
      setPrefill(null)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save measurement')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(values: MeasurementFormValues) {
    if (!editing) return
    setSubmitting(true)
    try {
      await update({ id: editing._id, ...values })
      toast.success('Measurement updated')
      setEditing(null)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update measurement')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await remove({ id: deleting._id })
      toast.success(`Deleted ${deleting.code}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete')
    }
  }

  function openForm(prefilled?: { length: number }) {
    if (prefilled) setPrefill({ ...prefilled, at: Date.now() })
    else setPrefill(null)
    setFormOpen(true)
    setMode(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Measurements</h1>
        <p className="text-sm text-muted-foreground">
          Capture a new measurement two ways: with your camera, or by typing it
          in.
        </p>
      </div>

      {/* Two choice cards (only shown when nothing is open) */}
      {mode === null && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon={Camera}
            title="Measure with camera"
            description="Use a reference object (credit card, A4) and tap two endpoints — we calculate the real distance."
            cta="Open camera"
            onClick={() => setMode('camera')}
          />
          <ChoiceCard
            icon={Pencil}
            title="Write a measurement"
            description="Enter the length, width, height, customer, and product details manually."
            cta="Open form"
            onClick={() => openForm()}
          />
        </div>
      )}

      {/* Inline camera */}
      {mode === 'camera' && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-primary" />
                  Camera measure
                </CardTitle>
                <CardDescription className="mt-1">
                  Place a reference object next to what you&rsquo;re measuring,
                  tap two endpoints of the reference, then two of the object.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CameraMeasure
              onCapture={(result) => {
                toast.success(
                  `Captured ${result.lengthCm.toFixed(2)} cm — opening form…`,
                )
                openForm({ length: Number(result.lengthCm.toFixed(2)) })
              }}
              onCancel={() => setMode(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Sub-section: created measurements */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Created measurements</h2>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin'
                ? 'Every measurement in the workspace.'
                : 'Measurements you created or were assigned.'}
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search code, customer, product…"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Dimensions</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data === undefined &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))}
                  {data && paged.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        {search
                          ? 'No measurements match your search.'
                          : 'No measurements yet — capture one above.'}
                      </td>
                    </tr>
                  )}
                  {paged.map((m) => (
                    <tr
                      key={m._id}
                      className="border-b last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <Badge variant="outline">{m.code}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.phoneNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">{m.productType}</td>
                      <td className="px-4 py-3">
                        {m.length} × {m.width} × {m.height} {m.unit}
                      </td>
                      <td className="px-4 py-3">{m.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateShort(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(m)}
                            disabled={!canEdit(m)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(m)}
                            disabled={!canEdit(m)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                <div>
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, data.length)} of {data.length}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Write-a-measurement modal */}
      <Modal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setPrefill(null)
        }}
        title="New measurement"
        description={
          prefill
            ? `Length pre-filled from camera capture (${prefill.length.toFixed(2)} cm).`
            : 'Fill in the details below.'
        }
        className="max-w-2xl"
      >
        <MeasurementForm
          key={prefill?.at ?? 'fresh'}
          defaultValues={
            prefill ? { length: prefill.length, unit: 'cm' } : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false)
            setPrefill(null)
          }}
          submitting={submitting}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `Edit ${editing.code}` : 'Edit measurement'}
        className="max-w-2xl"
      >
        {editing && (
          <MeasurementForm
            defaultValues={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitting={submitting}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete measurement?"
        description={
          deleting
            ? `${deleting.code} (${deleting.customerName}) will be permanently removed.`
            : ''
        }
        destructive
        confirmText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  cta,
  onClick,
}: {
  icon: typeof Camera
  title: string
  description: string
  cta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-full flex-col items-start gap-4 rounded-xl border bg-card p-6 text-left shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}
