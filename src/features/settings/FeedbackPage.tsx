import { useState } from 'react'
import { MessageSquare, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const CATEGORIES = ['Bug report', 'Feature request', 'Usability issue', 'Other']

export function FeedbackPage() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Please enter your feedback before submitting.')
      return
    }
    // In Phase 1 there's no backend — just acknowledge it locally
    setSubmitted(true)
    toast.success('Feedback noted — thank you!')
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
          Found a bug or have a suggestion? Let us know.
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

        <Button type="submit" disabled={!message.trim()}>
          <MessageSquare className="h-4 w-4" />
          Submit Feedback
        </Button>
      </form>
    </div>
  )
}
