import { Search, Menu, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store/appStore'
import { BuildingSelector } from './BuildingSelector'
import { NotificationBell } from './NotificationBell'

interface TopBarProps {
  onSearchOpen?: () => void
  onMobileMenuOpen?: () => void
}

/**
 * Top bar — building selector, search trigger, notifications, theme toggle.
 */
export function TopBar({ onSearchOpen, onMobileMenuOpen }: TopBarProps) {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border-default bg-surface px-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Building selector */}
      <BuildingSelector />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search trigger */}
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex gap-2 text-text-muted"
        onClick={onSearchOpen}
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search...</span>
        <kbd className="ml-2 pointer-events-none hidden select-none items-center gap-1 rounded border border-border-default bg-page px-1.5 text-[10px] font-medium text-text-muted sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search icon (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={onSearchOpen}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Notification bell */}
      <NotificationBell />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    </header>
  )
}
