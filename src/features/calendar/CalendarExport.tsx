/**
 * CalendarExport
 *
 * Button + export flow for generating a building-branded monthly
 * calendar PDF. Gathers events, observances, and building data from
 * stores, then delegates to the calendarPDF export module.
 *
 * The exported PDF is 2 pages:
 *   1. Branded header + html2canvas screenshot of the live calendar grid
 *      (preserves emojis, colours, and all styling exactly as on screen)
 *   2. Legend (all observances with dates + all events with time/location)
 *
 * Shows toast notifications for loading, success, and error states.
 * Requires a building to be selected (via appStore.currentBuildingId).
 */

import { useState, type RefObject } from 'react'
import { Download, Printer, ChevronDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { exportCalendarPDF } from '@/lib/export/calendarPDF'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'

interface CalendarExportProps {
  year: number
  month: number // 1-12
  /** Ref to the calendar grid DOM element for html2canvas capture */
  calendarRef?: RefObject<HTMLDivElement | null>
}

export function CalendarExport({ year, month, calendarRef }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const disabledObservanceIds = useAppStore((s) => s.disabledObservanceIds)
  const getBuildingById = useBuildingStore((s) => s.getBuildingById)
  const buildings = useBuildingStore((s) => s.buildings)
  const events = useEventStore((s) => s.events)

  const building = currentBuildingId ? getBuildingById(currentBuildingId) : undefined
  const hasBuildings = buildings.length > 0
  const exportDisabled = !building || isExporting

  async function handleExportPDF() {
    if (!building) {
      toast.error(
        hasBuildings
          ? 'Select a building from the top bar before exporting.'
          : 'Add a building first to export a branded calendar.',
        { duration: 5000 }
      )
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Generating calendar PDF…')

    try {
      // Filter events for the selected building and month
      const monthEvents = events.filter((event) => {
        if (event.buildingId !== building.id) return false
        if (!event.date) return false
        const eventDate = new Date(event.date + 'T00:00:00')
        return (
          eventDate.getFullYear() === year &&
          eventDate.getMonth() + 1 === month
        )
      })

      // Filter observances for the current month, excluding disabled and themes
      const monthObservances = DEFAULT_OBSERVANCES.filter((obs) => {
        if (obs.month !== month) return false
        if (obs.type === 'theme') return false
        if (disabledObservanceIds.includes(obs.id)) return false
        return true
      })

      await exportCalendarPDF({
        year,
        month,
        events: monthEvents.map((e) => ({
          date: e.date,
          name: e.name,
          status: e.status,
          startTime: e.startTime || undefined,
          endTime: e.endTime || undefined,
          location: e.location || undefined,
        })),
        observances: monthObservances.map((obs) => ({
          name: obs.name,
          month: obs.month,
          day: obs.day,
          emoji: obs.emoji,
        })),
        buildingName: building.name,
        brandColor: building.brandColor || '#3B7BF4',
        logoUrl: building.logoUrl,
        // Pass the live calendar grid element for html2canvas capture
        calendarElement: calendarRef?.current ?? null,
      })

      toast.success('Calendar PDF downloaded successfully.', { id: toastId })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      console.error('[CalendarExport] PDF export failed:', error)
      toast.error(`Export failed: ${message}`, { id: toastId, duration: 8000 })
    } finally {
      setIsExporting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  // When no building is selected, show a tooltip-wrapped disabled button
  if (!building) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                disabled
                aria-label="Export or print calendar — select a building first"
                className="gap-1 cursor-not-allowed"
              >
                <AlertCircle className="h-4 w-4 text-warning" />
                Export
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            {hasBuildings
              ? 'Select a building from the top bar to export the calendar'
              : 'Add a building first to export a branded calendar'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          aria-label="Export or print calendar"
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting…' : 'Export'}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={handleExportPDF}
          disabled={exportDisabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
