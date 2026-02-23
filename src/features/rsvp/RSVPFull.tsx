import type { Event } from '@/lib/types/event'

interface RSVPFullProps {
  event: Event
  onJoinWaitlist: () => void
}

export function RSVPFull({ event, onJoinWaitlist }: RSVPFullProps) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        This event is full
      </h2>

      <p className="text-gray-600 mb-6">
        All {event.rsvpLimit} spots have been filled.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          You can join the waitlist and we'll let you know if a spot opens up.
        </p>
      </div>

      <button
        type="button"
        onClick={onJoinWaitlist}
        className="w-full min-h-[48px] px-6 py-3 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
      >
        Join Waitlist
      </button>
    </div>
  )
}
