import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** If provided, user must type this text to confirm (for dangerous actions) */
  confirmText?: string
  confirmPlaceholder?: string
  onConfirm: () => void
  onCancel?: () => void
}

/**
 * Confirmation dialog for destructive or important actions.
 * Optionally requires typing a confirmation string (e.g., building name).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  confirmText,
  confirmPlaceholder,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('')

  const requiresTyping = Boolean(confirmText)
  const isConfirmEnabled = requiresTyping
    ? typedText.trim().toLowerCase() === confirmText?.trim().toLowerCase()
    : true

  function handleConfirm() {
    onConfirm()
    setTypedText('')
    onOpenChange(false)
  }

  function handleCancel() {
    setTypedText('')
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>

        {requiresTyping && (
          <div className="py-2">
            <p className="text-sm text-text-secondary mb-2">
              Type{' '}
              <span className="font-semibold text-text-primary">
                {confirmText}
              </span>{' '}
              to confirm.
            </p>
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={confirmPlaceholder ?? confirmText}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
