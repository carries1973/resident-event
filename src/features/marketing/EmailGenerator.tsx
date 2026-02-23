import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EventMarketing } from '@/lib/types/event'

interface EmailGeneratorProps {
  marketing: EventMarketing
  onRegenerateSection: (section: string) => void
}

/**
 * Displays email subject lines, email body, and SMS message
 * with copy-to-clipboard and per-section regeneration.
 */
export function EmailGenerator({
  marketing,
  onRegenerateSection,
}: EmailGeneratorProps) {
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="space-y-6">
      {/* Subject Lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Email Subject Lines
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('emailSubjectLines')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
        <div className="grid gap-2">
          {marketing.emailSubjectLines.map((subject, index) => (
            <Card
              key={index}
              className="cursor-pointer py-3 transition-colors hover:bg-accent/50"
              onClick={() => copyToClipboard(subject)}
            >
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-primary">{subject}</p>
                <Copy className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-text-muted">
            Click a subject line to copy it to your clipboard.
          </p>
        </div>
      </div>

      <Separator />

      {/* Email Body */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Email Body
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('emailBody')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
            {marketing.emailBody}
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => copyToClipboard(marketing.emailBody)}
          >
            <Copy className="h-3 w-3" />
            Copy body
          </Button>
        </div>
      </div>

      <Separator />

      {/* SMS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            SMS Message
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('sms')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>

        {/* Phone bubble mockup */}
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="rounded-xl bg-primary/10 px-4 py-3">
              <p className="text-sm text-text-primary">{marketing.sms}</p>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-xs text-text-muted">
                {marketing.sms.length}/160 characters
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => copyToClipboard(marketing.sms)}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
