import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

/**
 * Loading state for marketing materials generation.
 * Shows 4 skeleton sections with a pulsing status message.
 */
export function MarketingGenerating() {
  return (
    <div className="space-y-6">
      {/* Pulsing status message */}
      <div className="flex items-center gap-2 text-text-secondary animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">
          Generating marketing materials...
        </span>
      </div>

      {/* Skeleton section 1 — Email subject lines */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-32 rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
        <div className="bg-muted h-4 w-3/4 rounded animate-pulse" />
        <div className="bg-muted h-4 w-5/6 rounded animate-pulse" />
      </div>

      <Separator />

      {/* Skeleton section 2 — Email body */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-24 rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
        <div className="bg-muted h-4 w-2/3 rounded animate-pulse" />
      </div>

      <Separator />

      {/* Skeleton section 3 — SMS */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-20 rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
        <div className="bg-muted h-4 w-1/2 rounded animate-pulse" />
      </div>

      <Separator />

      {/* Skeleton section 4 — Social captions */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-36 rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
        <div className="bg-muted h-4 w-4/5 rounded animate-pulse" />
        <div className="bg-muted h-4 w-full rounded animate-pulse" />
      </div>
    </div>
  )
}
