import { Badge } from '@/components/ui/badge'
import type { EventStatus } from '@/lib/types/common'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  active: {
    label: 'Active',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
  needs_closeout: {
    label: 'Needs Closeout',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
  },
}

interface StatusBadgeProps {
  status: EventStatus
  className?: string
}

/**
 * Maps an EventStatus to a styled Badge with appropriate colour coding.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  )
}
