import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification, NotificationType } from '../types/notification'

interface NotificationState {
  notifications: AppNotification[]
  /**
   * Set of "eventId:type" keys for notifications the user has dismissed.
   * Persisted across sessions so the same alert never re-appears after
   * the user clears all notifications.
   */
  dismissedKeys: string[]
}

interface NotificationActions {
  addNotification: (notification: AppNotification) => void
  addNotifications: (notifications: AppNotification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void

  // Selectors
  getUnreadCount: () => number
  getNotificationsByEvent: (eventId: string) => AppNotification[]
  hasNotification: (eventId: string, type: string) => boolean
  /** Returns true if this eventId+type combo was previously dismissed */
  isDismissed: (eventId: string, type: NotificationType) => boolean

  // Reset
  resetAll: () => void
}

const initialState: NotificationState = {
  notifications: [],
  dismissedKeys: [],
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),

      addNotifications: (newNotifications) =>
        set((state) => ({
          notifications: [...newNotifications, ...state.notifications],
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) => {
        const notification = get().notifications.find((n) => n.id === id)
        set((state) => {
          const updated = {
            notifications: state.notifications.filter((n) => n.id !== id),
            dismissedKeys: state.dismissedKeys,
          }
          // If this notification is tied to an event, record the dismissal key
          // so the same alert doesn't re-appear after clearing
          if (notification?.eventId && notification?.type) {
            const key = `${notification.eventId}:${notification.type}`
            if (!state.dismissedKeys.includes(key)) {
              updated.dismissedKeys = [...state.dismissedKeys, key]
            }
          }
          return updated
        })
      },

      clearAll: () =>
        set((state) => {
          // Record all event-linked notifications as dismissed before clearing
          const newKeys = state.notifications
            .filter((n) => n.eventId && n.type)
            .map((n) => `${n.eventId}:${n.type}`)
          const merged = Array.from(new Set([...state.dismissedKeys, ...newKeys]))
          return { notifications: [], dismissedKeys: merged }
        }),

      // Selectors
      getUnreadCount: () =>
        get().notifications.filter((n) => !n.read).length,

      getNotificationsByEvent: (eventId) =>
        get().notifications.filter((n) => n.eventId === eventId),

      hasNotification: (eventId, type) =>
        get().notifications.some(
          (n) => n.eventId === eventId && n.type === type && !n.read,
        ),

      isDismissed: (eventId, type) => {
        const key = `${eventId}:${type}`
        return get().dismissedKeys.includes(key)
      },

      resetAll: () => set(initialState),
    }),
    {
      name: 'rei-notification-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          // Add dismissedKeys field to existing persisted state
          return { ...(persisted as NotificationState), dismissedKeys: [] }
        }
        return persisted as NotificationState
      },
    },
  ),
)
