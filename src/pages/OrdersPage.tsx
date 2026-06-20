import { useMemo, useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Truck,
  Package,
  CheckCircle2,
  Loader2,
  XCircle,
  ClipboardList,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { OrderForm, OrderFormValues } from '@/components/OrderForm'
import { FeatureGate } from '@/components/FeatureGate'
import { formatDateShort } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'
import type { Doc } from '../../convex/_generated/dataModel'

type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled'

type OrderRow = Doc<'orders'> & {
  creator: Doc<'users'> | null
  deliverer: Doc<'users'> | null
}

type Tab = 'all' | OrderStatus

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  return (
    <FeatureGate
      feature="Orders"
      description="Track customer orders end-to-end with status workflow, delivery audit, and team-wide visibility."
      benefits={[
        'Pending → in progress → ready → delivered workflow',
        'Inline status changes and one-click "mark delivered"',
        'Auto-generated order codes (ORD-####) and audit log',
        'Role-aware list — employees see only their own; admins see everything',
      ]}
    >
      <OrdersPageInner />
    </FeatureGate>
  )
}

function OrdersPageInner() {
  const { user } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<OrderRow | null>(null)
  const [deleting, setDeleting] = useState<OrderRow | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const stats = useQuery(api.orders.stats, isAuthenticated ? {} : 'skip')
  const orders = useQuery(
    api.orders.list,
    isAuthenticated
      ? {
          status: tab === 'all' ? undefined : tab,
          search: search || undefined,
        }
      : 'skip',
  ) as OrderRow[] | undefined

  const create = useMutation(api.orders.create)
  const update = useMutation(api.orders.update)
  const setStatus = useMutation(api.orders.setStatus)
  const remove = useMutation(api.orders.remove)

  const canEdit = (o: OrderRow) =>
    user?.role === 'admin' || o.createdBy === user?._id

  async function handleCreate(values: OrderFormValues) {
    setSubmitting(true)
    try {
      await create(normalize(values))
      toast.success('Order created')
      setCreating(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(values: OrderFormValues) {
    if (!editing) return
    setSubmitting(true)
    try {
      const { status, ...rest } = normalize(values)
      await update({ id: editing._id, ...rest })
      if (status && status !== editing.status) {
        await setStatus({ id: editing._id, status })
      }
      toast.success('Order updated')
      setEditing(null)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update order')
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
      toast.error(e?.message ?? 'Failed to delete order')
    }
  }

  async function markDelivered(o: OrderRow) {
    try {
      await setStatus({ id: o._id, status: 'delivered' })
      toast.success(`${o.code} marked as delivered`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed')
    }
  }

  const summary = useMemo(
    () => [
      {
        label: 'Total orders',
        value: stats?.total,
        icon: ClipboardList,
        color: 'text-foreground',
      },
      {
        label: 'Pending',
        value: stats?.pending,
        icon: Package,
        color: 'text-amber-500',
      },
      {
        label: 'In progress',
        value: stats?.inProgress,
        icon: Loader2,
        color: 'text-blue-500',
      },
      {
        label: 'Delivered',
        value: stats?.delivered,
        icon: Truck,
        color: 'text-emerald-500',
      },
    ],
    [stats],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Track orders from intake through delivery.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New order
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={cn('h-4 w-4', color)} />
            </CardHeader>
            <CardContent>
              {value === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + search */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map((t) => {
              const count =
                t.value === 'all'
                  ? stats?.total
                  : t.value === 'pending'
                    ? stats?.pending
                    : t.value === 'in_progress'
                      ? stats?.inProgress
                      : t.value === 'ready'
                        ? stats?.ready
                        : t.value === 'delivered'
                          ? stats?.delivered
                          : stats?.cancelled
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    tab === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {t.label}
                  {count !== undefined && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-[10px] font-semibold',
                        tab === t.value
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search code, customer, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Delivered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders === undefined &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={8} className="px-4 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))}
                {orders && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No orders {tab !== 'all' && `in "${tab.replace('_', ' ')}"`}.
                    </td>
                  </tr>
                )}
                {orders?.map((o) => (
                  <tr
                    key={o._id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Badge variant="outline">{o.code}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      {o.phoneNumber && (
                        <div className="text-xs text-muted-foreground">
                          {o.phoneNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{o.productType}</td>
                    <td className="px-4 py-3">{o.quantity}</td>
                    <td className="px-4 py-3">
                      <InlineStatus
                        value={o.status as OrderStatus}
                        disabled={!canEdit(o)}
                        onChange={async (next) => {
                          try {
                            await setStatus({ id: o._id, status: next })
                            toast.success(`${o.code} → ${next.replace('_', ' ')}`)
                          } catch (e: any) {
                            toast.error(e?.message ?? 'Failed')
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateShort(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.deliveredAt ? formatDateShort(o.deliveredAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {o.status !== 'delivered' &&
                          o.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Mark as delivered"
                              onClick={() => markDelivered(o)}
                              disabled={!canEdit(o)}
                            >
                              <Truck className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(o)}
                          disabled={!canEdit(o)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(o)}
                          disabled={!canEdit(o)}
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
        </CardContent>
      </Card>

      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="New order"
        description="Capture an order. You can update its status later."
      >
        <OrderForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `Edit ${editing.code}` : 'Edit order'}
      >
        {editing && (
          <OrderForm
            defaultValues={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitting={submitting}
            showStatus
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete order?"
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

function InlineStatus({
  value,
  onChange,
  disabled,
}: {
  value: OrderStatus
  onChange: (v: OrderStatus) => void
  disabled?: boolean
}) {
  const styles: Record<OrderStatus, string> = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    ready: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    delivered:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    cancelled:
      'border-destructive/30 bg-destructive/10 text-destructive',
  }
  const icons: Record<OrderStatus, JSX.Element> = {
    pending: <Package className="h-3 w-3" />,
    in_progress: <Loader2 className="h-3 w-3" />,
    ready: <CheckCircle2 className="h-3 w-3" />,
    delivered: <Truck className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  }
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as OrderStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          'h-7 w-[140px] gap-1.5 rounded-full border px-2.5 py-0 text-xs font-medium',
          styles[value],
        )}
      >
        <span className="flex items-center gap-1.5">
          {icons[value]}
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="in_progress">In progress</SelectItem>
        <SelectItem value="ready">Ready</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  )
}

function normalize(
  v: OrderFormValues,
): OrderFormValues & { phoneNumber?: string; currency?: string } {
  // Cast empty strings back to undefined for optional fields.
  return {
    ...v,
    phoneNumber: v.phoneNumber || undefined,
    currency: v.currency || undefined,
    notes: v.notes || undefined,
    totalAmount: v.totalAmount ? Number(v.totalAmount) : undefined,
  }
}
