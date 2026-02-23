import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  label: string
  to: string
  icon: React.ReactNode
}

// Keep to 5 items max — bottom bar space is limited
// Assets & Settings are accessible via desktop sidebar only on mobile
const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Home', to: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Planner', to: '/planner', icon: <Sparkles className="h-5 w-5" /> },
  { label: 'Calendar', to: '/calendar', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Buildings', to: '/buildings', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Events', to: '/events', icon: <Calendar className="h-5 w-5" /> },
]

/**
 * Bottom tab bar for mobile navigation.
 * Visible only on small screens (< lg breakpoint).
 */
export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-surface lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-brand'
                  : 'text-text-muted hover:text-text-secondary',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
