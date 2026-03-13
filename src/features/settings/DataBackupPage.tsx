import { useState, useRef } from 'react'
import { Download, Upload, Trash2, HardDrive, Bot, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ThemeToggle } from './ThemeToggle'
import {
  exportAllData,
  importAllData,
  clearAllData,
  getStorageUsage,
} from '@/lib/export/dataBackup'
import { generateAI, isAiConfigured } from '@/lib/ai/client'
import { toast } from 'sonner'

/** Format bytes into a human-readable MB string */
function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

/**
 * Data & Backup settings page.
 *
 * Route: /settings/data
 *
 * Provides storage monitoring, data export/import, theme toggling,
 * and a full data clear option with type-to-confirm safety.
 */
export function DataBackupPage() {
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI settings
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  async function handleTestConnection() {
    setTestStatus('testing')
    setTestMessage('')
    try {
      const result = await generateAI({
        systemPrompt: 'You are a helpful assistant.',
        userMessage: 'Reply with exactly: "Connection successful"',
        temperature: 0,
        maxTokens: 32,
      })
      if (result.text) {
        setTestStatus('success')
        setTestMessage('Connected successfully!')
      } else {
        setTestStatus('error')
        setTestMessage('Unexpected response from AI provider.')
      }
    } catch (err: unknown) {
      setTestStatus('error')
      setTestMessage(err instanceof Error ? err.message : 'Connection failed.')
    }
  }

  const storage = getStorageUsage()
  const isStorageWarning = storage.percentage >= 80

  // ── Export ──────────────────────────────────────────────────────────
  function handleExport() {
    try {
      const data = exportAllData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const filename = `resident-event-ideas-backup-${today}.json`

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch {
      toast.error('Failed to export data. Please try again.')
    }
  }

  // ── Import ─────────────────────────────────────────────────────────
  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result
      if (typeof json !== 'string') {
        toast.error('Failed to read file.')
        return
      }

      const result = importAllData(json)
      if (result.success) {
        toast.success('Data imported! Reloading...')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.error ?? 'Import failed.')
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read the file. Please try again.')
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  // ── Clear ──────────────────────────────────────────────────────────
  function handleClear() {
    try {
      clearAllData()
      toast.success('All data cleared. Reloading...')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error('Failed to clear data. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data & Backup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application data, theme preferences, and backups.
        </p>
      </div>

      {/* ── Storage Monitor ─────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Storage Usage
            </h2>
          </div>

          <div className="space-y-3">
            <Progress
              value={storage.percentage}
              className={isStorageWarning ? '[&>[data-slot=progress-indicator]]:bg-yellow-500' : ''}
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatBytes(storage.used)} / {formatBytes(storage.total)} used ({storage.percentage}%)
              </span>
            </div>

            {isStorageWarning && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Storage is running low. Consider exporting a backup and removing
                unused buildings or events to free up space.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Theme ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Appearance
          </h2>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* ── AI Settings ──────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              AI Provider
            </h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            All AI features are powered by Claude (Anthropic).
          </p>

          <div className="mb-4">
            <div className="w-full flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3">
              <div className="flex items-center gap-3">
                <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Claude (Anthropic)
                </span>
              </div>
              {!isAiConfigured() && import.meta.env.DEV && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  Set VITE_ANTHROPIC_API_KEY in .env
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="gap-2"
            >
              {testStatus === 'testing' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bot className="size-4" />
              )}
              Test Connection
            </Button>

            {testStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" />
                {testMessage}
              </span>
            )}
            {testStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <XCircle className="size-4" />
                {testMessage}
              </span>
            )}
          </div>

          {import.meta.env.DEV && (
            <p className="text-xs text-muted-foreground mt-3">
              Dev mode: API keys are read from environment variables. In production,
              keys are stored securely in Vercel.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Export ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Export All Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download a complete backup of your buildings, events, settings, and
            notifications as a JSON file.
          </p>
          <Button onClick={handleExport} className="gap-2">
            <Download className="size-4" />
            Export Backup
          </Button>
        </CardContent>
      </Card>

      {/* ── Import ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Import Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Restore data from a previously exported JSON backup file. This will
            replace all current data.
          </p>
          <Button variant="outline" onClick={handleImportClick} className="gap-2">
            <Upload className="size-4" />
            Import Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      {/* ── Reset / Clear All Data ──────────────────────────────────── */}
      <Card className="border-destructive/40">
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="size-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">
              Reset App Data
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Permanently delete <strong>all buildings, events, local events, settings, and
            notifications</strong> stored in this browser. The app will return to its
            initial empty state.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            This action cannot be undone. Export a backup above first if you want to
            keep your data.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="size-4" />
              Export Backup First
            </Button>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Clear Confirmation Dialog ───────────────────────────────── */}
      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Reset All App Data"
        description="This will permanently delete all buildings, events, local events, settings, and notifications stored in this browser. The app will return to its initial empty state. This action cannot be undone."
        confirmLabel="Reset Everything"
        variant="destructive"
        confirmText="DELETE ALL DATA"
        confirmPlaceholder="Type DELETE ALL DATA to confirm"
        onConfirm={handleClear}
      />
    </div>
  )
}
