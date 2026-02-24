/**
 * CalendarExport
 *
 * Button + export flow for generating a building-branded monthly
 * calendar PDF. Gathers events and building data from stores, then
 * delegates to the calendarPDF export module.
 *
 * Shows toast notifications for loading, success, and error states.
 * Requires a building to be selected (via appStore.currentBuildingId).
 */

import { useState } from 'react'
import { Download, Printer, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { exportCalendarPDF } from '@/lib/export/calendarPDF'

interface CalendarExportProps {
  year: number
  month: number // 1-12
}

export function CalendarExport({ year, month }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const getBuildingById = useBuildingStore((s) => s.getBuildingById)
  const events = useEventStore((s) => s.events)

  const building = currentBuildingId ? getBuildingById(currentBuildingId) : undefined

  async function handleExportPDF() {
    if (!building) {
      toast.error('Please select a building first to export the calendar.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Generating calendar PDF...')

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

      await exportCalendarPDF({
        year,
        month,
        events: monthEvents.map((e) => ({
          date: e.date,
          name: e.name,
          status: e.status,
        })),
        buildingName: building.name,
        brandColor: building.brandColor || '#3B7BF4',
        logoUrl: building.logoUrl,
      })

      toast.success('Calendar PDF exported successfully.', { id: toastId })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error(`Export failed: ${message}`, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  function handlePrint() {
    window.print()
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
          {isExporting ? 'Exporting...' : 'Export'}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
