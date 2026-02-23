import { User } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EventMarketing } from '@/lib/types/event'
import type { Event } from '@/lib/types/event'

interface MarketingPreviewProps {
  marketing: EventMarketing
  event: Event
}

/**
 * Read-only tabbed preview showing marketing materials in
 * realistic context frames: Email, SMS, and Social.
 */
export function MarketingPreview({ marketing, event }: MarketingPreviewProps) {
  const subjectLine = marketing.emailSubjectLines[0] ?? 'Event Invitation'

  return (
    <Tabs defaultValue="email" className="space-y-4">
      <TabsList>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="sms">SMS</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
      </TabsList>

      {/* Email preview */}
      <TabsContent value="email">
        <div className="rounded-lg border overflow-hidden">
          {/* Email header */}
          <div className="border-b bg-muted/30 px-4 py-3 space-y-1">
            <div className="flex gap-2 text-xs">
              <span className="font-semibold text-text-muted">From:</span>
              <span className="text-text-secondary">Building Management</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="font-semibold text-text-muted">To:</span>
              <span className="text-text-secondary">Residents</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="font-semibold text-text-muted">Subject:</span>
              <span className="font-medium text-text-primary">
                {subjectLine}
              </span>
            </div>
          </div>

          {/* Email body */}
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
              {marketing.emailBody}
            </p>
          </div>
        </div>
      </TabsContent>

      {/* SMS preview */}
      <TabsContent value="sms">
        <div className="mx-auto max-w-xs">
          {/* Phone frame */}
          <div className="rounded-[2rem] border-2 bg-background p-4 pt-8 pb-6 shadow-sm">
            {/* Status bar placeholder */}
            <div className="mb-4 flex items-center justify-center">
              <span className="text-xs font-medium text-text-muted">
                Messages
              </span>
            </div>

            {/* Sender label */}
            <div className="mb-3 text-center">
              <span className="text-xs text-text-muted">
                Building Management
              </span>
            </div>

            {/* Message bubble */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5">
                <p className="text-sm text-text-primary">{marketing.sms}</p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mt-1 pl-2">
              <span className="text-[10px] text-text-muted">
                {event.date || 'Today'}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Social preview */}
      <TabsContent value="social">
        <div className="mx-auto max-w-sm">
          <div className="rounded-lg border overflow-hidden">
            {/* Instagram-like header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-text-muted" />
              </div>
              <span className="text-xs font-semibold text-text-primary">
                Your Building
              </span>
            </div>

            {/* Image placeholder */}
            <div className="flex h-48 items-center justify-center bg-muted/30">
              <span className="text-sm text-text-muted">
                {event.name} event image
              </span>
            </div>

            {/* Caption */}
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed text-text-secondary">
                {marketing.socialCaptions[0] ?? ''}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
