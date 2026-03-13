import { useState } from 'react'
import { MessageSquare, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const CATEGORIES = ['Bug report', 'Feature request', 'Usability issue', 'Other']

// Formspree endpoint — replace FORM_ID with your actual Formspree form ID
// Sign up free at https://formspree.io and create a form to get your ID
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpwzgkqb'

export function FeedbackPage() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Please enter your feedback before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          category,
          message: message.trim(),
          _subject: `[REP Feedback] ${category}`,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        toast.success('Feedback sent — thank you!')
      } else {
        const data = await response.json().catch(() => ({}))
        const errMsg =
          data?.errors?.[0]?.message ?? 'Failed to send feedback. Please try again.'
        toast.error(errMsg)
      }
    } catch {
      toast.error('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Thanks for your feedback!</h2>
        <p className="text-text-secondary max-w-sm mb-6">
          Your input helps improve Resident Event Planner. We'll review it shortly.
        </p>
        <Button variant="outline" onClick={() => { setSubmitted(false); setMessage('') }}>
          Submit More Feedback
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Feedback</h1>
        <p className="text-text-secondary mt-1">
          Found a bug or have a suggestion? Let us know — your message goes directly to the team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                  category === cat
                    ? 'bg-primary text-white border-primary'
                    : 'border-border-default text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="feedback-message" className="text-sm font-medium text-text-primary">
            Message
          </label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue or your suggestion..."
            rows={5}
            className="resize-none"
          />
        </div>

        <Button type="submit" disabled={!message.trim() || submitting}>
          <MessageSquare className="h-4 w-4" />
          {submitting ? 'Sending…' : 'Submit Feedback'}
        </Button>
      </form>

      <p className="text-xs text-text-muted flex items-center gap-1">
        Feedback is handled securely via{' '}
        <a
          href="https://formspree.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-text-secondary inline-flex items-center gap-0.5"
        >
          Formspree <ExternalLink className="h-3 w-3" />
        </a>
      </p>
      <p className="text-xs text-text-muted pt-4 border-t border-border">
        Built by{' '}
        <a
          href="https://propertyconsultinggroup.ca/resident-experience/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand hover:underline"
        >
          Property Consulting Group
        </a>
        . We help multifamily teams reduce turnover through resident experience consulting.{' '}
        <a
          href="https://propertyconsultinggroup.ca/resident-experience/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-text-secondary"
        >
          Learn more
        </a>
      </p>
    </div>
  )
}
