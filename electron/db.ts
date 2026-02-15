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

  // Ensure recordings table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY NOT NULL,
      tracking_number TEXT NOT NULL,
      carrier TEXT,
      file_key TEXT NOT NULL,
      file_size INTEGER,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'recording',
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `)

  // ─── Default settings ────────────────────────────────────────
  const defaultStoragePath = isDev
    ? path.join(process.env.APP_ROOT!, 'storage')
    : path.join(app.getPath('userData'), 'storage')

  const storedValue = JSON.stringify(defaultStoragePath)

  sqlite.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run('storage_base_path', storedValue, Date.now())

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
