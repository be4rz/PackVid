/**
 * Lifecycle Scheduler — Background Archive Manager
 *
 * Runs in the Electron main process. On app start (after 30s delay) and
 * every 6 hours, scans for recordings eligible for archival and compresses them.
 *
 * Reads settings:
 * - `lifecycle_enabled` (boolean) — whether auto-archive is active
 * - `archive_after_days` (number) — days after recording before archiving
 *
 * @see electron/ipc/lifecycle.ts:compressRecording
 */

import { eq, and } from 'drizzle-orm'
import { getDb } from './db'
import { appSettings, recordings } from '../src/db/schema'
import { compressRecording } from './ipc/lifecycle'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 30 * 1000
const DEFAULT_ARCHIVE_AFTER_DAYS = 14

let isRunning = false
let intervalId: ReturnType<typeof setInterval> | null = null

/** Read a setting from app_settings, return parsed JSON or default */
function getSetting<T>(key: string, defaultValue: T): T {
  try {
    const db = getDb()
    const rows = db.select().from(appSettings)
      .where(eq(appSettings.key, key))
      .all()

    if (rows.length === 0) return defaultValue
    return JSON.parse(rows[0].value) as T
  } catch {
    return defaultValue
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/** Run one lifecycle scan — find eligible recordings and compress them */
async function runScan(): Promise<void> {
  if (isRunning) {
    console.log('[lifecycle] Scan already in progress, skipping')
    return
  }

  const enabled = getSetting<boolean>('lifecycle_enabled', true)
  if (!enabled) {
    console.log('[lifecycle] Auto-archive disabled, skipping')
    return
  }

  isRunning = true
  const archiveAfterDays = getSetting<number>('archive_after_days', DEFAULT_ARCHIVE_AFTER_DAYS)
  const cutoffMs = Date.now() - archiveAfterDays * 24 * 60 * 60 * 1000
  const cutoffDate = new Date(cutoffMs)

  console.log(`[lifecycle] Scanning for recordings older than ${archiveAfterDays} days...`)

  try {
    const db = getDb()

    // Find eligible: saved + active + finished before cutoff
    const eligible = db.select().from(recordings)
      .where(
        and(
          eq(recordings.status, 'saved'),
          eq(recordings.lifecycleStage, 'active'),
        ),
      )
      .all()
      .filter(row => {
        const finishedAt = row.finishedAt instanceof Date
          ? row.finishedAt
          : row.finishedAt ? new Date(row.finishedAt as unknown as number) : null
        return finishedAt != null && finishedAt < cutoffDate
      })

    if (eligible.length === 0) {
      console.log('[lifecycle] No recordings eligible for archival')
      return
    }

    console.log(`[lifecycle] Found ${eligible.length} recording(s) to archive`)

    let archived = 0
    let failed = 0
    let spaceSaved = 0

    for (const row of eligible) {
      try {
        const result = await compressRecording(row.id, row.fileKey)
        archived++
        spaceSaved += result.originalFileSize - result.newFileSize
        console.log(`[lifecycle] Archived ${row.trackingNumber}: ${formatBytes(result.originalFileSize)} → ${formatBytes(result.newFileSize)}`)
      } catch (err) {
        failed++
        console.error(`[lifecycle] Failed to archive ${row.trackingNumber}:`, err)
      }
    }

    console.log(`[lifecycle] Scan complete: ${archived} archived, ${failed} failed, ${formatBytes(spaceSaved)} saved`)
  } catch (err) {
    console.error('[lifecycle] Scan error:', err)
  } finally {
    isRunning = false
  }
}

/** Start the lifecycle scheduler */
export function startLifecycleScheduler() {
  // Run after startup delay
  setTimeout(() => {
    runScan().catch(err => console.error('[lifecycle] Startup scan error:', err))
  }, STARTUP_DELAY_MS)

  // Run periodically
  intervalId = setInterval(() => {
    runScan().catch(err => console.error('[lifecycle] Periodic scan error:', err))
  }, SIX_HOURS_MS)

  console.log('[lifecycle] Scheduler started (first scan in 30s, then every 6h)')
}

/** Stop the lifecycle scheduler */
export function stopLifecycleScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
