import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Building2,
  Calendar,
  Heart,
  Database,
  Package,
  Library,
  UserCog,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store/appStore'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Plan',
    items: [
      { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Event Planner', to: '/planner', icon: <Sparkles className="h-4 w-4" /> },
      { label: 'Calendar', to: '/calendar', icon: <CalendarDays className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Buildings', to: '/buildings', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Events', to: '/events', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Observances', to: '/observances', icon: <Heart className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Assets',
    items: [
      { label: 'Event Packages', to: '/assets/packages', icon: <Package className="h-4 w-4" /> },
      { label: 'Resource Library', to: '/assets/library', icon: <Library className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Property Profile', to: '/settings/profile', icon: <UserCog className="h-4 w-4" /> },
      { label: 'Data & Backup', to: '/settings/data', icon: <Database className="h-4 w-4" /> },
      { label: 'Feedback', to: '/settings/feedback', icon: <MessageSquare className="h-4 w-4" /> },
    ],
  },
]

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16',
        'hidden lg:flex', // Hidden on mobile — MobileNav handles small screens
      )}
    >
      {/* Logo / App name */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm flex-shrink-0">
          RE
        </div>
        {sidebarOpen && (
          <span className="text-sm font-semibold text-sidebar-foreground truncate">
            Resident Events
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {sidebarOpen && (
              <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
                        !sidebarOpen && 'justify-center',
                      )
                    }
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — collapse button on desktop */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => useAppStore.getState().toggleSidebar()}
          className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg
            className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
