import { Badge } from '@/components/ui/badge'
import type { EventStatus } from '@/lib/types/common'
import { cn } from '@/lib/utils'

/**
 * Visual configuration per status.
 * active gets a pulsing live dot indicator.
 */
const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; className: string; pulse?: boolean; icon?: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  active: {
    label: 'In Progress',
    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    pulse: true,
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
 * Active events show a pulsing live indicator dot.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium gap-1.5', className)}
    >
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
        </span>
      )}
      {config.label}
    </Badge>
  )
}
