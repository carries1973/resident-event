import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

/**
 * 404 — shown when no route matches.
 * Gives the user a clear message and a way back to the dashboard.
 */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <FileQuestion className="h-16 w-16 text-text-muted mb-4" />
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary mb-6 max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/')}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
