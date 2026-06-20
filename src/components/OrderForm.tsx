import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Label, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Doc } from '../../convex/_generated/dataModel'

const STATUSES = [
  'pending',
  'in_progress',
  'ready',
  'delivered',
  'cancelled',
] as const

export const orderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phoneNumber: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  productType: z.string().min(1, 'Product type is required'),
  quantity: z.coerce.number().int().positive('Must be > 0'),
  totalAmount: z.coerce.number().nonnegative('Must be ≥ 0').optional(),
  currency: z
    .string()
    .max(8, 'Currency code is too long')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(STATUSES).optional(),
})

export type OrderFormValues = z.infer<typeof orderSchema>

interface OrderFormProps {
  defaultValues?: Partial<Doc<'orders'>>
  onSubmit: (values: OrderFormValues) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  /**
   * When true, show the status dropdown (edit mode). For create mode it
   * defaults to "pending" silently.
   */
  showStatus?: boolean
}

export function OrderForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  showStatus,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: defaultValues?.customerName ?? '',
      phoneNumber: defaultValues?.phoneNumber ?? '',
      productType: defaultValues?.productType ?? '',
      quantity: defaultValues?.quantity ?? 1,
      totalAmount: defaultValues?.totalAmount ?? 0,
      currency: defaultValues?.currency ?? 'USD',
      notes: defaultValues?.notes ?? '',
      status: (defaultValues?.status as (typeof STATUSES)[number]) ?? 'pending',
    },
  })

  const status = watch('status') ?? 'pending'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" error={errors.customerName?.message}>
          <Input {...register('customerName')} placeholder="Acme Inc." />
        </Field>
        <Field label="Phone number" error={errors.phoneNumber?.message}>
          <Input {...register('phoneNumber')} placeholder="+1 555 0100" />
        </Field>
        <Field label="Product type" error={errors.productType?.message}>
          <Input
            {...register('productType')}
            placeholder="Door / Window / ..."
          />
        </Field>
        <Field label="Quantity" error={errors.quantity?.message}>
          <Input type="number" min={1} step={1} {...register('quantity')} />
        </Field>
        <Field label="Total amount" error={errors.totalAmount?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            {...register('totalAmount')}
          />
        </Field>
        <Field label="Currency" error={errors.currency?.message}>
          <Input {...register('currency')} placeholder="USD" />
        </Field>
      </div>

      {showStatus && (
        <Field label="Status" error={errors.status?.message}>
          <Select
            value={status}
            onValueChange={(v) =>
              setValue('status', v as (typeof STATUSES)[number], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          rows={3}
          placeholder="Internal notes about this order…"
          {...register('notes')}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save order'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
