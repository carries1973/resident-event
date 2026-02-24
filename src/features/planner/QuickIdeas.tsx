import { useState, useCallback } from 'react'
import {
  Sparkles,
  Shuffle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Trash2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { generateAI, isAiConfigured, AiError } from '@/lib/ai/client'
import { parseAiResponse, aiQuickIdeasArraySchema } from '@/lib/ai/schemas'
import type { AiQuickIdea } from '@/lib/ai/schemas'
import { buildQuickIdeasPrompt } from '@/lib/ai/prompts/quickIdeas'
import { QuickIdeaCard } from './QuickIdeaCard'
import type { Building } from '@/lib/types/building'

const SESSIONS_STORAGE_KEY = 'rei-quick-ideas-sessions'
const MAX_SESSIONS = 10

interface QuickIdeasSession {
  id: string
  topic: string
  building: string
  ideas: AiQuickIdea[]
  createdAt: string
}

function loadSessions(): QuickIdeasSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: QuickIdeasSession[]): void {
  localStorage.setItem(
    SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions.slice(0, MAX_SESSIONS)),
  )
}

interface QuickIdeasProps {
  building: Building
  onExpandToFullPlan?: (idea: AiQuickIdea) => void
  personaOverride?: string
  eventMonthLabel?: string
}

export function QuickIdeas({ building, onExpandToFullPlan, personaOverride, eventMonthLabel }: QuickIdeasProps) {
  const [topic, setTopic] = useState('')
  const [ideas, setIdeas] = useState<AiQuickIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<QuickIdeasSession[]>(loadSessions)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const generate = useCallback(
    async (overrideTopic?: string) => {
      const effectiveTopic = overrideTopic ?? topic

      if (!isAiConfigured()) {
        toast.error('AI is not configured. Check your API key in .env')
        return
      }

      setLoading(true)
      setError(null)
      setIdeas([])

      try {
        const { system, user } = buildQuickIdeasPrompt(building, effectiveTopic, {
          personaOverride: personaOverride || undefined,
          eventMonth: eventMonthLabel || undefined,
        })
        const result = await generateAI({
          systemPrompt: system,
          userMessage: user,
        })

        const parsed = parseAiResponse(result.text, aiQuickIdeasArraySchema)

        if (!parsed.success) {
          setError(parsed.error)
          return
        }

        setIdeas(parsed.data)

        // Generate a descriptive session name
        const now = new Date()
        const monthLabel = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
        const sessionName = effectiveTopic && effectiveTopic !== 'surprise me'
          ? effectiveTopic.charAt(0).toUpperCase() + effectiveTopic.slice(1)
          : `Surprise Mix — ${monthLabel}`

        const newSession: QuickIdeasSession = {
          id: crypto.randomUUID(),
          topic: sessionName,
          building: building.name,
          ideas: parsed.data,
          createdAt: new Date().toISOString(),
        }

        const updated = [newSession, ...sessions].slice(0, MAX_SESSIONS)
        setSessions(updated)
        saveSessions(updated)
      } catch (err) {
        if (err instanceof AiError) {
          setError(err.message)
        } else {
          setError('Something went wrong generating ideas. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [topic, building, sessions, personaOverride, eventMonthLabel],
  )

  const handleDismissIdea = useCallback((index: number) => {
    setIdeas((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleResumeSession = (session: QuickIdeasSession) => {
    setIdeas(session.ideas)
    // Clear topic if it was a "Surprise Mix" session (auto-named), otherwise restore it
    setTopic(session.topic.startsWith('Surprise Mix') ? '' : session.topic)
    setError(null)
    toast.success(`Resumed: ${session.topic}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id)
    setSessions(updated)
    saveSessions(updated)
    setDeleteConfirmId(null)
    if (expandedSessionId === id) setExpandedSessionId(null)
  }

  const toggleSession = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id))
    setDeleteConfirmId(null)
  }

  const formatSessionDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Building summary for item 7
  const amenitySummary = [
    ...(building.amenities ?? []),
    ...(building.customAmenities ?? []),
  ].slice(0, 4).join(' · ')

  const hasAmenities = (building.amenities?.length ?? 0) > 0 || (building.customAmenities?.length ?? 0) > 0

  return (
    <div className="space-y-6 mt-4">
      {/* Explainer — only shown when no sessions yet (item 6) */}
      {sessions.length === 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-text-secondary space-y-1">
          <p className="font-medium text-text-primary">Getting started</p>
          <p>Select your building, describe the type of event you want, and hit <span className="font-medium text-text-primary">Generate Ideas</span> — or use <span className="font-medium text-text-primary">Surprise Me</span> for a random mix.</p>
          <p>Select a concept to save it or build a full event plan.</p>
        </div>
      )}

      {/* Building data summary (item 7) */}
      <div className="flex items-start gap-2 text-sm">
        <Building2 className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
        {hasAmenities ? (
          <p className="text-text-muted">
            {amenitySummary}
            {(building.amenities?.length ?? 0) + (building.customAmenities?.length ?? 0) > 4 && (
              <span> · +{(building.amenities?.length ?? 0) + (building.customAmenities?.length ?? 0) - 4} more</span>
            )}
            {building.unitCount && <span> · {building.unitCount} units</span>}
          </p>
        ) : (
          <p className="text-text-muted">
            No amenities added for this building.{' '}
            <a href="/buildings" className="text-primary underline underline-offset-2">
              Add them in Buildings
            </a>{' '}
            for more tailored ideas.
          </p>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary" htmlFor="quick-ideas-topic">
          What kind of event are you thinking about?
        </label>
        <Textarea
          id="quick-ideas-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., wellness morning, summer BBQ, rooftop social..."
          className="resize-none"
          rows={2}
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => generate()}
            disabled={loading || !topic.trim()}
          >
            <Sparkles className="h-4 w-4" />
            Generate Ideas
          </Button>
          <Button
            variant="outline"
            onClick={() => generate('surprise me')}
            disabled={loading}
            title="Let the AI choose a theme based on your building and the current season"
          >
            <Shuffle className="h-4 w-4" />
            Surprise Me
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Generating ideas for {building.name}...
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-text-primary font-medium">
                  Failed to generate ideas
                </p>
                <p className="text-sm text-text-secondary">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && ideas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-primary">
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''} generated
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generate()}
              disabled={!topic.trim()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea, index) => (
              <QuickIdeaCard
                key={`${idea.name}-${index}`}
                idea={idea}
                building={building}
                onDismiss={() => handleDismissIdea(index)}
                onExpandToFullPlan={onExpandToFullPlan}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions (item 5) */}
      {sessions.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <h2 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border">
                {/* Session header */}
                <div className="flex w-full items-center justify-between px-4 py-3">
                  {/* Left: title + meta */}
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => toggleSession(session.id)}
                  >
                    <p className="text-sm font-medium text-text-primary truncate">
                      {session.topic}
                    </p>
                    <p className="text-xs text-text-muted">
                      {session.building} &middot; {formatSessionDate(session.createdAt)} &middot;{' '}
                      {session.ideas.length} idea{session.ideas.length !== 1 ? 's' : ''}
                    </p>
                    {/* Preview idea names */}
                    {expandedSessionId !== session.id && session.ideas.length > 0 && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {session.ideas.slice(0, 3).map((i) => i.name).join(' · ')}
                        {session.ideas.length > 3 && ` · +${session.ideas.length - 3} more`}
                      </p>
                    )}
                  </button>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 px-2 text-xs"
                      onClick={() => handleResumeSession(session)}
                      title="Reload this session's ideas"
                    >
                      <Play className="h-3 w-3" />
                      Resume
                    </Button>

                    {deleteConfirmId === session.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-text-muted">Delete?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-text-muted hover:text-danger"
                        onClick={() => setDeleteConfirmId(session.id)}
                        title="Delete this session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <button
                      type="button"
                      className="p-1 text-text-muted hover:text-text-primary transition-colors"
                      onClick={() => toggleSession(session.id)}
                      aria-label={expandedSessionId === session.id ? 'Collapse' : 'Expand'}
                    >
                      {expandedSessionId === session.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Session ideas */}
                {expandedSessionId === session.id && (
                  <div className="px-4 pb-3 border-t">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-3">
                      {session.ideas.map((idea, idx) => (
                        <QuickIdeaCard
                          key={`session-${session.id}-${idx}`}
                          idea={idea}
                          building={building}
                          onExpandToFullPlan={onExpandToFullPlan}
                          onDismiss={() => {
                            const updated = sessions.map((s) =>
                              s.id === session.id
                                ? { ...s, ideas: s.ideas.filter((_, i) => i !== idx) }
                                : s,
                            )
                            setSessions(updated)
                            saveSessions(updated)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
