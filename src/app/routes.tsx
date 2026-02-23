import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAppStore } from '@/lib/store/appStore'

// Onboarding (real)
import { WelcomePage } from '@/features/onboarding/WelcomePage'
import { SetupWizard } from '@/features/onboarding/SetupWizard'
import { OnboardingSuccess } from '@/features/onboarding/OnboardingSuccess'

// Buildings (real)
import { BuildingsListPage } from '@/features/buildings/BuildingsListPage'
import { BuildingFormPage } from '@/features/buildings/BuildingFormPage'

// Events (real)
import { EventsListPage } from '@/features/events/EventsListPage'
import { EventFormPage } from '@/features/events/EventFormPage'
import { EventDetailPage } from '@/features/events/EventDetailPage'

// Calendar & Dashboard (real)
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// Observances (real)
import { ObservancesPage } from '@/features/observances/ObservancesPage'

// Settings (real)
import { DataBackupPage } from '@/features/settings/DataBackupPage'

// Planner (real)
import { PlannerPage } from '@/features/planner/PlannerPage'

// RSVP (real — public page, no layout)
import { RSVPPage } from '@/features/rsvp/RSVPPage'

// 404
import { NotFoundPage } from '@/features/common/NotFoundPage'

export function AppRoutes() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)

  // If onboarding not complete, show onboarding flow
  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={<WelcomePage />} />
        <Route path="/onboarding/setup" element={<SetupWizard />} />
        <Route path="/onboarding/success" element={<OnboardingSuccess />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* Public route (no layout) */}
      <Route path="/rsvp/:eventId" element={<RSVPPage />} />

      {/* Onboarding redirect after completion */}
      <Route path="/onboarding/*" element={<Navigate to="/" replace />} />

      {/* App routes (with layout shell) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/calendar" element={<CalendarPage />} />

        <Route path="/buildings" element={<BuildingsListPage />} />
        <Route path="/buildings/new" element={<BuildingFormPage />} />
        <Route path="/buildings/:id" element={<BuildingFormPage />} />
        <Route path="/buildings/:id/edit" element={<BuildingFormPage />} />

        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage />} />

        <Route path="/observances" element={<ObservancesPage />} />
        <Route path="/settings/data" element={<DataBackupPage />} />
      </Route>

      {/* 404 — inside layout so sidebar is still visible */}
      <Route element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
