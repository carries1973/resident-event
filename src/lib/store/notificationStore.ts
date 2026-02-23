import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification } from '../types/notification'

interface NotificationState {
  notifications: AppNotification[]
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

  // Reset
  resetAll: () => void
}

const initialState: NotificationState = {
  notifications: [],
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

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      // Selectors
      getUnreadCount: () =>
        get().notifications.filter((n) => !n.read).length,

      getNotificationsByEvent: (eventId) =>
        get().notifications.filter((n) => n.eventId === eventId),

      hasNotification: (eventId, type) =>
        get().notifications.some(
          (n) => n.eventId === eventId && n.type === type && !n.read,
        ),

      resetAll: () => set(initialState),
    }),
    {
      name: 'rei-notification-store',
      version: 1,
    },
  ),
)
