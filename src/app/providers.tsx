import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  children: ReactNode
}

/**
 * App-level providers wrapping the entire application.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider delayDuration={300}>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider>
  )
}
