import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/lib/store/notificationStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/dates'

/**
 * Notification bell in the top bar with a dropdown panel.
 */
export function NotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.getUnreadCount())
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const [open, setOpen] = useState(false)

  const recentNotifications = notifications.slice(0, 20)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-brand hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              No notifications yet
            </div>
          ) : (
            recentNotifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markAsRead(n.id)
                }}
                className={cn(
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover',
                  !n.read && 'bg-blue-50/50 dark:bg-blue-950/20',
                )}
              >
                <div
                  className={cn(
                    'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                    !n.read ? 'bg-brand' : 'bg-transparent',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
