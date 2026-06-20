import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {cancelText}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          onClick={async () => {
            await onConfirm()
            onOpenChange(false)
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
