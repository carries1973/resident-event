import { Copy, RefreshCw, User, Ruler } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { EventMarketing } from '@/lib/types/event'

interface SocialGeneratorProps {
  marketing: EventMarketing
  onRegenerateSection: (section: string) => void
}

/**
 * Displays social media captions in Instagram-like frames,
 * plus visual prompt, colour palette, and icon suggestions.
 */
export function SocialGenerator({
  marketing,
  onRegenerateSection,
}: SocialGeneratorProps) {
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="space-y-6">
      {/* Social Captions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Social Media Captions
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('socialCaptions')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate Captions
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {marketing.socialCaptions.map((caption, index) => (
            <Card key={index} className="py-0 overflow-hidden">
              {/* Instagram-like header */}
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-text-muted" />
                </div>
                <span className="text-xs font-semibold text-text-primary">
                  Your Building
                </span>
              </div>

              {/* Image placeholder area */}
              <div className="flex h-32 items-center justify-center bg-muted/30">
                <span className="text-xs text-text-muted">
                  Event image
                </span>
              </div>

              {/* Caption */}
              <CardContent className="space-y-2 pt-3 pb-3">
                <p className="text-sm leading-relaxed text-text-secondary">
                  {caption}
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(caption)}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Visual Prompt */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Visual Prompt
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('visualPrompt')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4 font-mono text-sm text-text-secondary">
          {marketing.visualPrompt}
        </div>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => copyToClipboard(marketing.visualPrompt)}
          >
            <Copy className="h-3 w-3" />
            Copy prompt
          </Button>
        </div>
      </div>

      <Separator />

      {/* Colour Palette */}
      {marketing.colorPalette.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Colour Palette
          </h3>
          <div className="flex flex-wrap gap-3">
            {marketing.colorPalette.map((colour, index) => (
              <button
                key={index}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/50"
                onClick={() => copyToClipboard(colour)}
                title={`Copy ${colour}`}
              >
                <div
                  className="h-6 w-6 rounded-full border"
                  style={{ backgroundColor: colour }}
                />
                <span className="text-xs font-mono text-text-secondary">
                  {colour}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            Click a swatch to copy the hex colour code.
          </p>
        </div>
      )}

      {/* Icon Suggestions */}
      {marketing.iconSuggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Suggested Icons
          </h3>
          <div className="flex flex-wrap gap-2">
            {marketing.iconSuggestions.map((icon, index) => (
              <Badge key={index} variant="outline">
                {icon}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Design Specifications (REP v3.3) */}
      {marketing.designSpecs && marketing.designSpecs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                Design Specifications
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onRegenerateSection('designSpecs')}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {marketing.designSpecs.map((spec, index) => (
                <Card key={index} className="py-0 overflow-hidden">
                  <CardContent className="space-y-2 pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">
                        {spec.format}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {spec.dimensions}
                      </Badge>
                    </div>
                    {spec.headline && (
                      <div>
                        <span className="text-xs font-medium text-text-muted">Headline</span>
                        <p className="text-sm text-text-secondary">{spec.headline}</p>
                      </div>
                    )}
                    {spec.supportingText && (
                      <div>
                        <span className="text-xs font-medium text-text-muted">Copy / CTA</span>
                        <p className="text-sm text-text-secondary">{spec.supportingText}</p>
                      </div>
                    )}
                    {spec.layoutNotes && (
                      <div>
                        <span className="text-xs font-medium text-text-muted">Layout</span>
                        <p className="text-xs text-text-muted leading-relaxed">{spec.layoutNotes}</p>
                      </div>
                    )}
                    {spec.exportFormat && (
                      <div className="pt-1">
                        <Badge variant="secondary" className="text-xs">
                          Export: {spec.exportFormat}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
