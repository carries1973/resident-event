import { useEffect } from 'react'

interface UnsavedChangesGuardProps {
  /** Whether there are unsaved changes to guard against */
  hasUnsavedChanges: boolean
}

/**
 * Guards against accidental navigation away from a form with unsaved changes.
 * Uses the browser's native beforeunload event to warn on refresh/close.
 *
 * Note: In-app React Router navigation is not blocked because the app uses
 * BrowserRouter (not a data router). The beforeunload event covers browser
 * refresh, tab close, and external navigation.
 */
export function UnsavedChangesGuard({
  hasUnsavedChanges,
}: UnsavedChangesGuardProps) {
  useEffect(() => {
    if (!hasUnsavedChanges) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // No visible UI — this is a behaviour-only component
  return null
}
