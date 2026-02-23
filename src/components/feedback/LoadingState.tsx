import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** Variant controls the skeleton layout pattern */
  variant?: 'card' | 'list' | 'form' | 'page'
  /** Number of skeleton items to show */
  count?: number
  /** Optional message shown below the skeleton */
  message?: string
  className?: string
}

/**
 * Loading skeleton component — shown during async operations.
 * Every async operation must show one of these variants.
 */
export function LoadingState({
  variant = 'card',
  count = 3,
  message,
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('animate-in fade-in-0 duration-300', className)}>
      {variant === 'card' && <CardSkeleton count={count} />}
      {variant === 'list' && <ListSkeleton count={count} />}
      {variant === 'form' && <FormSkeleton />}
      {variant === 'page' && <PageSkeleton />}
      {message && (
        <p className="text-center text-sm text-text-muted mt-4">{message}</p>
      )}
    </div>
  )
}

function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-border-default bg-surface p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border-default bg-surface p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section header */}
      <Skeleton className="h-6 w-1/4" />
      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-default bg-surface p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Content area */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
