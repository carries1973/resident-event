import { useState } from 'react'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { toast } from 'sonner'
import type { Event } from '@/lib/types/event'
import type { RSVPEntry, AttendanceStatus } from '@/lib/types/common'

interface RSVPFormProps {
  event: Event
  onSuccess: () => void
}

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'attending', label: 'I plan to attend' },
  { value: 'maybe', label: 'I might be able to make it' },
  { value: 'not_attending', label: "I can't make it" },
]

export function RSVPForm({ event, onSuccess }: RSVPFormProps) {
  const addRSVP = useEventStore((s) => s.addRSVP)
  const building = useBuildingStore((s) =>
    s.buildings.find((b) => b.id === event.buildingId)
  )

  const brandColor = building?.brandColor || '#3B7BF4'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('attending')
  const [unitNumber, setUnitNumber] = useState('')
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (guestCount < 1 || guestCount > 10) {
      newErrors.guestCount = 'Number of guests must be between 1 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Honeypot check — silently "succeed" without saving
    if (honeypot) {
      onSuccess()
      return
    }

    if (!validate()) return

    setSubmitting(true)

    try {
      const entry: RSVPEntry = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim() || undefined,
        unitNumber: unitNumber.trim() || undefined,
        guestCount,
        attendanceStatus,
        dietaryNotes: dietaryNotes.trim() || undefined,
        accessibilityNeeds: accessibilityNeeds.trim() || undefined,
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
      }

      addRSVP(event.id, entry)
      toast.success('Registration successful!')
      onSuccess()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const inputClasses =
    'w-full min-h-[44px] px-3 py-2.5 text-base rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: 'absolute', left: '-9999px' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Name */}
      <div>
        <label
          htmlFor="rsvp-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="rsvp-name"
          type="text"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
          }}
          className={`${inputClasses} ${errors.name ? 'ring-2 ring-red-400 border-red-400' : ''}`}
          style={{
            ...(!(errors.name) && { '--tw-ring-color': brandColor } as React.CSSProperties),
          }}
          placeholder="Your full name"
          autoComplete="name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="rsvp-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="rsvp-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
          }}
          className={`${inputClasses} ${errors.email ? 'ring-2 ring-red-400 border-red-400' : ''}`}
          style={{
            ...(!(errors.email) && { '--tw-ring-color': brandColor } as React.CSSProperties),
          }}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Number of guests */}
      <div>
        <label
          htmlFor="rsvp-guests"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Number of guests <span className="text-red-500">*</span>
        </label>
        <input
          id="rsvp-guests"
          type="number"
          required
          min={1}
          max={10}
          value={guestCount}
          onChange={(e) => {
            setGuestCount(parseInt(e.target.value, 10) || 1)
            if (errors.guestCount)
              setErrors((prev) => ({ ...prev, guestCount: '' }))
          }}
          className={`${inputClasses} ${errors.guestCount ? 'ring-2 ring-red-400 border-red-400' : ''}`}
          placeholder="1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Including yourself (maximum 10)
        </p>
        {errors.guestCount && (
          <p className="mt-1 text-sm text-red-600">{errors.guestCount}</p>
        )}
      </div>

      {/* Attendance status */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          Will you attend? <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {ATTENDANCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              style={{
                borderColor: attendanceStatus === opt.value ? brandColor : '#E5E7EB',
                backgroundColor: attendanceStatus === opt.value ? `${brandColor}08` : 'white',
              }}
            >
              <input
                type="radio"
                name="attendanceStatus"
                value={opt.value}
                checked={attendanceStatus === opt.value}
                onChange={() => setAttendanceStatus(opt.value)}
                className="h-4 w-4 shrink-0"
                style={{ accentColor: brandColor }}
              />
              <span className="text-sm text-gray-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Unit number */}
      <div>
        <label
          htmlFor="rsvp-unit"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Unit number{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="rsvp-unit"
          type="text"
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          className={inputClasses}
          placeholder="e.g., 304"
          autoComplete="off"
        />
      </div>

      {/* Dietary notes */}
      <div>
        <label
          htmlFor="rsvp-dietary"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Dietary notes{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="rsvp-dietary"
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          className={`${inputClasses} min-h-[80px] resize-y`}
          placeholder="Any dietary restrictions or allergies"
          rows={2}
        />
      </div>

      {/* Accessibility needs */}
      <div>
        <label
          htmlFor="rsvp-accessibility"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Accessibility needs{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="rsvp-accessibility"
          value={accessibilityNeeds}
          onChange={(e) => setAccessibilityNeeds(e.target.value)}
          className={`${inputClasses} min-h-[80px] resize-y`}
          placeholder="Any accessibility requirements"
          rows={2}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[48px] px-6 py-3 text-base font-semibold text-white rounded-lg transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: brandColor,
          '--tw-ring-color': brandColor,
        } as React.CSSProperties}
      >
        {submitting ? 'Registering...' : 'Register for Event'}
      </button>
    </form>
  )
}
