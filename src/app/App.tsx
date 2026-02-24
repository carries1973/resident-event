import { useEffect, useRef } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Providers } from './providers'
import { AppRoutes } from './routes'
import { useAppStore } from '@/lib/store/appStore'
import { useEventStore } from '@/lib/store/eventStore'
import { useNotificationStore } from '@/lib/store/notificationStore'
import { generateNotifications } from '@/lib/notifications/engine'

/**
 * Root App component.
 * - Wraps everything in BrowserRouter + Providers
 * - Syncs theme class on mount
 * - Runs notification engine on load + interval
 */
export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <ThemeSync />
        <NotificationRunner />
        <AppRoutes />
        <SpeedInsights />
      </Providers>
    </BrowserRouter>
  )
}

/** Syncs the theme CSS class on initial mount */
function ThemeSync() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}

/** Runs the notification engine on app load and every 5 minutes */
function NotificationRunner() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    function run() {
      const events = useEventStore.getState().events
      const existing = useNotificationStore.getState().notifications
      const newNotifications = generateNotifications(events, existing)
      if (newNotifications.length > 0) {
        useNotificationStore.getState().addNotifications(newNotifications)
      }
    }

    // Run immediately on mount
    run()

    // Run every 5 minutes
    intervalRef.current = setInterval(run, 5 * 60 * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
