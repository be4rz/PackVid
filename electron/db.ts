/**
 * Database Connection — Electron Main Process Singleton
 *
 * Creates and exports the Drizzle ORM instance for the main process.
 * Uses `app.getPath('userData')` in production for persistent storage,
 * and `database/packvid.sqlite` in development.
 *
 * Called once during app startup from `main.ts`.
 */

import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../src/db/schema'

let sqlite: Database.Database
let db: ReturnType<typeof drizzle>

/**
 * Initialize the database connection and ensure tables exist.
 * Must be called after `app.whenReady()` (so `app.getPath` works).
 */
export function initDatabase() {
  // ─── Resolve DB path (must be inside function, after app.whenReady) ──
  const isDev = !!process.env['VITE_DEV_SERVER_URL']
  const dbPath = isDev
    ? path.join(process.env.APP_ROOT!, 'database', 'packvid.sqlite')
    : path.join(app.getPath('userData'), 'packvid.sqlite')

  // Ensure the directory exists
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  // Ensure app_settings table exists (avoids migration dependency)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  db = drizzle(sqlite, { schema })
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function getSqlite() {
  if (!sqlite) throw new Error('Database not initialized. Call initDatabase() first.')
  return sqlite
}
