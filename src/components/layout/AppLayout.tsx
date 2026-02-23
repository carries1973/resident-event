import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { SearchPalette } from '@/features/search/SearchPalette'
import { useAppStore } from '@/lib/store/appStore'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Building2,
  Calendar,
  Heart,
  Database,
} from 'lucide-react'

/**
 * App layout shell — sidebar + topbar + content area + mobile nav.
 * Wraps all authenticated routes via React Router's <Outlet>.
 */
export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Global Cmd+K search shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchOpen = useCallback(() => setSearchOpen(true), [])
  const handleMobileMenuOpen = useCallback(() => setMobileMenuOpen(true), [])

  return (
    <div className="min-h-screen bg-page">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile menu (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="px-4 py-3 border-b border-white/10">
            <SheetTitle className="text-sidebar-foreground text-sm font-semibold">
              Resident Events
            </SheetTitle>
          </SheetHeader>
          <MobileSidebarNav onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarOpen ? 'lg:pl-60' : 'lg:pl-16',
        )}
      >
        <TopBar
          onSearchOpen={handleSearchOpen}
          onMobileMenuOpen={handleMobileMenuOpen}
        />

        <main className="p-4 md:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Global search palette (Cmd+K) */}
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

/** Sidebar navigation for the mobile Sheet */
function MobileSidebarNav({ onClose }: { onClose: () => void }) {
  const navItems = [
    { group: 'Plan', items: [
      { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Event Planner', to: '/planner', icon: <Sparkles className="h-4 w-4" /> },
      { label: 'Calendar', to: '/calendar', icon: <CalendarDays className="h-4 w-4" /> },
    ]},
    { group: 'Manage', items: [
      { label: 'Buildings', to: '/buildings', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Events', to: '/events', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Observances', to: '/observances', icon: <Heart className="h-4 w-4" /> },
    ]},
    { group: 'Settings', items: [
      { label: 'Data & Backup', to: '/settings/data', icon: <Database className="h-4 w-4" /> },
    ]},
  ]

  return (
    <nav className="py-4 space-y-5">
      {navItems.map((group) => (
        <div key={group.group}>
          <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {group.group}
          </p>
          <ul className="space-y-0.5 px-2">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
