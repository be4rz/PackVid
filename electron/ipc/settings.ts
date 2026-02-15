/**
 * Settings IPC Handlers — Infrastructure Layer
 *
 * Provides CRUD operations on the app_settings key-value store
 * via Electron IPC. Renderer calls these through `window.api.settings.*`.
 *
 * Channels:
 * - settings:get   — Get a single setting by key (returns parsed JSON or null)
 * - settings:set   — Upsert a setting by key (value is JSON-stringified)
 * - settings:getAll — Get all settings as Record<string, unknown>
 */

import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { appSettings } from '../../src/db/schema'

export function registerSettingsHandlers() {
  // ─── Get a single setting ──────────────────────────────────────
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const db = getDb()
    const rows = db.select().from(appSettings).where(eq(appSettings.key, key)).all()

    if (rows.length === 0) return null

    try {
      return JSON.parse(rows[0].value)
    } catch {
      return rows[0].value
    }
  })

  // ─── Upsert a setting ─────────────────────────────────────────
  ipcMain.handle('settings:set', async (_event, key: string, value: unknown) => {
    const db = getDb()
    const jsonValue = JSON.stringify(value)
    const now = new Date()

    db.insert(appSettings)
      .values({ key, value: jsonValue, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: jsonValue, updatedAt: now },
      })
      .run()
  })

  // ─── Get all settings ─────────────────────────────────────────
  ipcMain.handle('settings:getAll', async () => {
    const db = getDb()
    const rows = db.select().from(appSettings).all()

    const result: Record<string, unknown> = {}
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value)
      } catch {
        result[row.key] = row.value
      }
    }
    return result
  })
}
