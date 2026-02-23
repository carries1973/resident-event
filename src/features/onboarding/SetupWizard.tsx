import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { CANADIAN_PROVINCES } from '@/lib/types/common'
import { ArrowLeft } from 'lucide-react'

/**
 * Minimal building setup wizard — only 3 fields: name, city, province.
 * Everything else can be added later via the building edit form.
 */
export function SetupWizard() {
  const navigate = useNavigate()
  const createBuilding = useBuildingStore((s) => s.createBuilding)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const setCurrentBuildingId = useAppStore((s) => s.setCurrentBuildingId)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Building name is required.')
      return
    }
    if (!city.trim()) {
      setError('City is required.')
      return
    }
    if (!province) {
      setError('Province is required.')
      return
    }

    const building = createBuilding({
      name: name.trim(),
      city: city.trim(),
      province,
    })

    setCurrentBuildingId(building.id)
    completeOnboarding()
    navigate('/onboarding/success')
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Set up your first building
        </h1>
        <p className="text-text-secondary mb-8">
          Just the basics — you can add more details later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="building-name" className="block text-sm font-medium text-text-primary mb-1.5">
              Building name <span className="text-danger">*</span>
            </label>
            <Input
              id="building-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., "The Windsor"'
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="building-city" className="block text-sm font-medium text-text-primary mb-1.5">
              City <span className="text-danger">*</span>
            </label>
            <Input
              id="building-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Calgary"
            />
          </div>

          <div>
            <label htmlFor="building-province" className="block text-sm font-medium text-text-primary mb-1.5">
              Province <span className="text-danger">*</span>
            </label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger id="building-province">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {CANADIAN_PROVINCES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full mt-6">
            Create building
          </Button>
        </form>
      </div>
    </div>
  )
}
