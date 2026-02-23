import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, CalendarDays, Building2 } from 'lucide-react'

/**
 * Success screen after building creation during onboarding.
 * Shows 3 action cards for next steps.
 */
export function OnboardingSuccess() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-14 w-14 text-success" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Your building is ready!
        </h1>
        <p className="text-text-secondary mb-8">
          Here&rsquo;s what you can do next:
        </p>

        <div className="grid gap-3 mb-8">
          <ActionCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Plan events"
            description="Use the AI planner to generate event ideas for your building."
            onClick={() => navigate('/planner')}
          />
          <ActionCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="Explore the calendar"
            description="See Canadian observances and start building your event calendar."
            onClick={() => navigate('/calendar')}
          />
          <ActionCard
            icon={<Building2 className="h-5 w-5" />}
            title="Add more details"
            description="Set up amenities, branding, and resident mix for better results."
            onClick={() => navigate('/buildings')}
          />
        </div>

        <Button variant="outline" onClick={() => navigate('/')}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex gap-3 items-start text-left bg-surface rounded-lg p-4 border border-border-default hover:border-brand/30 hover:bg-surface-hover transition-colors w-full"
    >
      <div className="text-brand flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </button>
  )
}
