import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
}

/**
 * Error state component — shown when an async operation fails.
 * Every async operation must have an error state with retry action.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  icon,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-danger">
        {icon ?? <AlertTriangle className="h-10 w-10" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-6">{message}</p>
      <div className="flex items-center gap-3">
        {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
