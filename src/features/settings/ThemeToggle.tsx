import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store/appStore'

/**
 * Standalone theme toggle component.
 *
 * Displays the current theme (Light / Dark) with a Sun or Moon icon.
 * Clicking the button toggles between light and dark mode via the
 * app store.
 */
export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const isLight = theme === 'light'

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="default"
        onClick={toggleTheme}
        className="gap-2"
      >
        {isLight ? (
          <>
            <Sun className="size-4" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="size-4" />
            <span>Dark</span>
          </>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </div>
  )
}
