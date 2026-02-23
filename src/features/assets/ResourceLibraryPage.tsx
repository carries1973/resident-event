import { Library } from 'lucide-react'

export function ResourceLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Resource Library</h1>
        <p className="text-text-secondary mt-1">
          Templates, vendor contacts, and past event references.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Library className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h2>
        <p className="text-text-secondary max-w-sm">
          The resource library will house your templates, vendor contacts, and a catalogue of your most successful past events.
        </p>
      </div>
    </div>
  )
}
