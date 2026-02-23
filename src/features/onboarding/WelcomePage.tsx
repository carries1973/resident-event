import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CalendarDays, Building2, Sparkles } from 'lucide-react'

/**
 * First-run welcome screen — shown when onboardingComplete is false.
 */
export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white font-bold text-2xl">
            RE
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Welcome to Resident Event Ideas
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          AI-powered event planning for Canadian residential communities.
          Let&rsquo;s get your first building set up.
        </p>

        {/* Value props */}
        <div className="grid gap-4 mb-8 text-left">
          <ValueProp
            icon={<Building2 className="h-5 w-5" />}
            title="Building profiles"
            description="Set up your properties with amenities, resident mix, and brand identity."
          />
          <ValueProp
            icon={<Sparkles className="h-5 w-5" />}
            title="AI event planning"
            description="Generate tailored event ideas matched to your residents and space."
          />
          <ValueProp
            icon={<CalendarDays className="h-5 w-5" />}
            title="Calendar & management"
            description="Plan, promote, and track events with integrated tools."
          />
        </div>

        <Button size="lg" className="w-full" onClick={() => navigate('/onboarding/setup')}>
          Get started
        </Button>
      </div>
    </div>
  )
}

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 items-start bg-surface rounded-lg p-4 border border-border-default">
      <div className="text-brand flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  )
}
