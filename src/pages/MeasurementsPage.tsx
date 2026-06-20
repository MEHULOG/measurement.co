import { useMemo, useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Card,
  CardContent,
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
import type { MeasurementWithUsers } from '@/types'

const PAGE_SIZE = 10

export default function MeasurementsPage() {
  const { user } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customer, setCustomer] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<MeasurementWithUsers | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<MeasurementWithUsers | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [lastCapture, setLastCapture] = useState<{
    lengthMm: number
    lengthCm: number
    at: number
  } | null>(null)

  const { isAuthenticated } = useConvexAuth()
  const data = useQuery(
    api.measurements.list,
    isAuthenticated
      ? {
          search: search || undefined,
          customer: customer || undefined,
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate + 'T23:59:59').getTime() : undefined,
        }
      : 'skip',
  )

  const create = useMutation(api.measurements.create)
  const update = useMutation(api.measurements.update)
  const remove = useMutation(api.measurements.remove)

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE))
  const paged = useMemo(
    () => data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [],
    [data, page],
  )

  const canEdit = (m: MeasurementWithUsers) =>
    user?.role === 'admin' || m.createdBy === user?._id

  async function handleCreate(values: MeasurementFormValues) {
    setSubmitting(true)
    try {
      await create(values)
      toast.success('Measurement created')
      setCreating(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create measurement')
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
      toast.error(e?.message ?? 'Failed to delete measurement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Measurements</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, search, and filter customer measurements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={cameraOpen ? 'secondary' : 'outline'}
            onClick={() => setCameraOpen((o) => !o)}
          >
            <Camera className="h-4 w-4" />
            {cameraOpen ? 'Hide camera' : 'Measure with camera'}
            {cameraOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New measurement
          </Button>
        </div>
      </div>

      {/* Inline camera section */}
      {cameraOpen && (
        <Card className="overflow-hidden border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-primary" />
                Camera measure
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Place a reference object next to what you&rsquo;re measuring,
                tap the endpoints, then save it into a new measurement.
              </p>
            </div>
            {lastCapture && (
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                Last capture:{' '}
                <span className="font-semibold text-foreground">
                  {lastCapture.lengthCm.toFixed(2)} cm
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <CameraMeasure
              onCapture={(result) => {
                setLastCapture({ ...result, at: Date.now() })
                toast.success(
                  `Captured ${result.lengthCm.toFixed(2)} cm — opening form…`,
                )
                setCameraOpen(false)
                setCreating(true)
              }}
              onCancel={() => setCameraOpen(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search code, customer…"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
              />
            </div>
            <Input
              placeholder="Filter by customer"
              value={customer}
              onChange={(e) => {
                setPage(1)
                setCustomer(e.target.value)
              }}
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1)
                setStartDate(e.target.value)
              }}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1)
                setEndDate(e.target.value)
              }}
            />
          </div>
        </CardContent>
      </Card>

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
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data === undefined &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3" colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))}
                {data && paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No measurements match your filters.
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
                    <td className="px-4 py-3">
                      {m.creator?.name ?? 'Unknown'}
                    </td>
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

      <Modal
        open={creating}
        onOpenChange={(o) => {
          setCreating(o)
          if (!o) setLastCapture(null)
        }}
        title="New measurement"
        description={
          lastCapture
            ? `Length pre-filled from camera capture (${lastCapture.lengthCm.toFixed(2)} cm).`
            : 'Fill in the details below.'
        }
      >
        <MeasurementForm
          // Reset internal form when a new capture comes in so the prefill applies
          key={lastCapture?.at ?? 'fresh'}
          defaultValues={
            lastCapture
              ? { length: Number(lastCapture.lengthCm.toFixed(2)), unit: 'cm' }
              : undefined
          }
          onSubmit={async (values) => {
            await handleCreate(values)
            setLastCapture(null)
          }}
          onCancel={() => {
            setCreating(false)
            setLastCapture(null)
          }}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `Edit ${editing.code}` : 'Edit measurement'}
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
