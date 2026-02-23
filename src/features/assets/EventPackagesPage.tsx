import { Package } from 'lucide-react'

export function EventPackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Event Packages</h1>
        <p className="text-text-secondary mt-1">
          Ready-to-use event packages for quick planning.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h2>
        <p className="text-text-secondary max-w-sm">
          Event packages will let you save and reuse complete event setups — including checklists, marketing materials, and budget templates.
        </p>
      </div>
    </div>
  )
}
