import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TONE_OPTIONS } from '@/lib/data/brandTones'
import { compressImage, isValidImageFile } from '@/lib/utils/imageCompression'
import { isValidHexColour } from '@/lib/utils/colors'
import { toast } from 'sonner'

interface BrandingSectionProps {
  logoUrl?: string
  brandColor: string
  brandTones: string[]
  wordsToUse: string[]
  wordsToAvoid: string[]
  onChange: (updates: {
    logoUrl?: string
    brandColor?: string
    brandTones?: string[]
    wordsToUse?: string[]
    wordsToAvoid?: string[]
  }) => void
}

export function BrandingSection({
  logoUrl,
  brandColor,
  brandTones,
  wordsToUse,
  wordsToAvoid,
  onChange,
}: BrandingSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      toast.error('Please upload a PNG, JPG, or SVG file.')
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      onChange({ logoUrl: compressed })
      toast.success('Logo uploaded and compressed')
    } catch {
      toast.error('Failed to compress logo. Try a different image.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeLogo() {
    onChange({ logoUrl: undefined })
  }

  function handleColorChange(value: string) {
    // Allow partial hex input
    if (value === '' || value === '#' || /^#[0-9a-fA-F]{0,6}$/.test(value)) {
      onChange({ brandColor: value })
    }
  }

  function toggleTone(tone: string) {
    if (brandTones.includes(tone)) {
      onChange({ brandTones: brandTones.filter((t) => t !== tone) })
    } else if (brandTones.length < 3) {
      onChange({ brandTones: [...brandTones, tone] })
    } else {
      toast.info('Maximum 3 brand tones')
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Building logo
        </label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Building logo"
                className="h-16 w-16 rounded-lg object-cover border border-border-default"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-danger text-white flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border-default hover:border-brand/50 text-text-muted hover:text-brand transition-colors"
            >
              <Upload className="h-5 w-5" />
            </button>
          )}
          <div className="text-sm text-text-muted">
            <p>PNG, JPG, or SVG</p>
            <p>Auto-compressed to ≤50KB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      {/* Brand colour */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Brand colour
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHexColour(brandColor) ? brandColor : '#8F1D23'}
            onChange={(e) => onChange({ brandColor: e.target.value })}
            className="h-10 w-10 cursor-pointer rounded border border-border-default"
          />
          <Input
            value={brandColor}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#8F1D23"
            className="w-28 font-mono text-sm"
          />
        </div>
      </div>

      {/* Brand tones */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Brand tones <span className="text-text-muted font-normal">(up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => toggleTone(tone)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                brandTones.includes(tone)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface border-border-default text-text-secondary hover:border-brand/30'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Words to use / avoid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Words to use
          </label>
          <WordList words={wordsToUse} onChange={(w) => onChange({ wordsToUse: w })} placeholder="Add word" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Words to avoid
          </label>
          <WordList words={wordsToAvoid} onChange={(w) => onChange({ wordsToAvoid: w })} placeholder="Add word" />
        </div>
      </div>
    </div>
  )
}

function WordList({
  words,
  onChange,
  placeholder,
}: {
  words: string[]
  onChange: (words: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (!val || words.includes(val)) return
    onChange([...words, val])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </div>
      {words.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1 rounded-full bg-page px-2 py-0.5 text-xs text-text-secondary"
            >
              {w}
              <button
                type="button"
                onClick={() => onChange(words.filter((x) => x !== w))}
                className="hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
