import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { Input, Label, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { CameraMeasure } from '@/components/CameraMeasure'
import { Measurement } from '@/types'

const UNITS = ['cm', 'mm', 'inch', 'ft'] as const
type Unit = (typeof UNITS)[number]
type DimensionKey = 'length' | 'width' | 'height'

export const measurementSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phoneNumber: z
    .string()
    .min(5, 'Phone number is too short')
    .max(20, 'Phone number is too long'),
  productType: z.string().min(1, 'Product type is required'),
  length: z.coerce.number().nonnegative('Must be ≥ 0'),
  width: z.coerce.number().nonnegative('Must be ≥ 0'),
  height: z.coerce.number().nonnegative('Must be ≥ 0'),
  unit: z.enum(UNITS),
  quantity: z.coerce.number().int().positive('Must be > 0'),
  notes: z.string().optional(),
})

export type MeasurementFormValues = z.infer<typeof measurementSchema>

interface MeasurementFormProps {
  defaultValues?: Partial<Measurement>
  onSubmit: (values: MeasurementFormValues) => Promise<void>
  onCancel: () => void
  submitting?: boolean
}

// Convert from mm into the form's currently selected unit
function mmToUnit(mm: number, unit: Unit): number {
  switch (unit) {
    case 'mm':
      return mm
    case 'cm':
      return mm / 10
    case 'inch':
      return mm / 25.4
    case 'ft':
      return mm / 304.8
  }
}

export function MeasurementForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: MeasurementFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      customerName: defaultValues?.customerName ?? '',
      phoneNumber: defaultValues?.phoneNumber ?? '',
      productType: defaultValues?.productType ?? '',
      length: defaultValues?.length ?? 0,
      width: defaultValues?.width ?? 0,
      height: defaultValues?.height ?? 0,
      unit: (defaultValues?.unit as Unit) ?? 'cm',
      quantity: defaultValues?.quantity ?? 1,
      notes: defaultValues?.notes ?? '',
    },
  })

  const unit = watch('unit')
  const [cameraField, setCameraField] = useState<DimensionKey | null>(null)

  function handleCameraCapture(result: { lengthMm: number }) {
    if (!cameraField) return
    const converted = mmToUnit(result.lengthMm, unit)
    const rounded = Math.round(converted * 100) / 100
    setValue(cameraField, rounded, { shouldValidate: true, shouldDirty: true })
    setCameraField(null)
  }

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
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <DimensionField
          label="Length"
          error={errors.length?.message}
          register={register('length')}
          onCamera={() => setCameraField('length')}
        />
        <DimensionField
          label="Width"
          error={errors.width?.message}
          register={register('width')}
          onCamera={() => setCameraField('width')}
        />
        <DimensionField
          label="Height"
          error={errors.height?.message}
          register={register('height')}
          onCamera={() => setCameraField('height')}
        />
        <Field label="Unit" error={errors.unit?.message}>
          <Select
            value={unit}
            onValueChange={(v) =>
              setValue('unit', v as Unit, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          rows={3}
          placeholder="Anything special about this order..."
          {...register('notes')}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save measurement'}
        </Button>
      </div>

      <Modal
        open={cameraField !== null}
        onOpenChange={(o) => !o && setCameraField(null)}
        title={`Measure ${cameraField ?? ''} with camera`}
        description="Place a reference object next to what you're measuring, then tap the endpoints."
        className="max-w-3xl"
      >
        {cameraField && (
          <CameraMeasure
            onCapture={handleCameraCapture}
            onCancel={() => setCameraField(null)}
          />
        )}
      </Modal>
    </form>
  )
}

function DimensionField({
  label,
  error,
  register,
  onCamera,
}: {
  label: string
  error?: string
  register: ReturnType<ReturnType<typeof useForm<MeasurementFormValues>>['register']>
  onCamera: () => void
}) {
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-1">
        <Input type="number" step="0.01" {...register} className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onCamera}
          title={`Measure ${label.toLowerCase()} with camera`}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
    </Field>
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
