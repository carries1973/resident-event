import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Copy, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useEventStore, useEventStoreHydrated, computeEventStatus } from '@/lib/store/eventStore'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EventStatusFlow } from './EventStatusFlow'
import { EventOverviewTab } from './tabs/EventOverviewTab'
import { EventMarketingTab } from './tabs/EventMarketingTab'
import { EventPosterTab } from './tabs/EventPosterTab'
import { EventDayOfTab } from './tabs/EventDayOfTab'
import { EventCloseoutTab } from './tabs/EventCloseoutTab'
import { EventRSVPManagerTab } from './tabs/EventRSVPManagerTab'
import { toast } from 'sonner'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const hasHydrated = useEventStoreHydrated()
  const event = useEventStore((s) => s.events.find((e) => e.id === id))
  const duplicateEvent = useEventStore((s) => s.duplicateEvent)
  const deleteEvent = useEventStore((s) => s.deleteEvent)
  const transitionStatus = useEventStore((s) => s.transitionStatus)

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">Loading&hellip;</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Event not found.</p>
        <Button variant="link" onClick={() => navigate('/events')}>
          Back to events
        </Button>
      </div>
    )
  }

  const displayStatus = computeEventStatus(event)
  const checklistCompleted = event.dayOfChecklist.filter((i) => i.completed).length
  const checklistTotal = event.dayOfChecklist.length

  function handleDuplicate() {
    if (!event) return
    const dup = duplicateEvent(event.id)
    if (dup) {
      toast.success(`Duplicated as "${dup.name}"`)
      navigate(`/events/${dup.id}`)
    }
  }

  function handleCancel() {
    if (!event) return
    transitionStatus(event.id, 'cancelled')
    toast.success('Event cancelled')
    setShowCancelConfirm(false)
  }

  function handleDelete() {
    if (!event) return
    deleteEvent(event.id)
    toast.success('Event deleted')
    navigate('/events')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{event.name}</h1>
              <StatusBadge status={displayStatus} />
            </div>
            <EventStatusFlow
              event={event}
              onCancelRequest={() => setShowCancelConfirm(true)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${event.id}/edit`)}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="mr-1.5 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketing" className="gap-1.5">
            Marketing
            {event.marketing && <Badge variant="outline" className="h-4 px-1 text-[10px]">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="poster">Poster</TabsTrigger>
          <TabsTrigger value="dayof" className="gap-1.5">
            Day-Of
            {checklistTotal > 0 && (
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                {checklistCompleted}/{checklistTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closeout" className="gap-1.5">
            Closeout
            {displayStatus === 'needs_closeout' && (
              <Badge className="h-4 px-1 text-[10px] bg-warning text-white">!</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rsvp" className="gap-1.5">
            RSVP
            {event.rsvpEnabled && event.rsvpCount > 0 && (
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                {event.rsvpCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EventOverviewTab event={event} />
        </TabsContent>
        <TabsContent value="marketing">
          <EventMarketingTab event={event} />
        </TabsContent>
        <TabsContent value="poster">
          <EventPosterTab event={event} />
        </TabsContent>
        <TabsContent value="dayof">
          <EventDayOfTab event={event} />
        </TabsContent>
        <TabsContent value="closeout">
          <EventCloseoutTab event={event} />
        </TabsContent>
        <TabsContent value="rsvp">
          <EventRSVPManagerTab event={event} />
        </TabsContent>
      </Tabs>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancel event"
        description={
          <span>
            Are you sure you want to cancel <strong>{event.name}</strong>?
            You can reactivate it later if needed.
          </span>
        }
        confirmLabel="Cancel event"
        variant="destructive"
        onConfirm={handleCancel}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete event"
        description={
          <span>
            Permanently delete <strong>{event.name}</strong>? This cannot be undone.
          </span>
        }
        confirmText={event.name}
        confirmPlaceholder="Type event name"
        confirmLabel="Delete event"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
