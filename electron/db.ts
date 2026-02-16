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
      lifecycle_stage TEXT NOT NULL DEFAULT 'active',
      thumbnail_key TEXT,
      original_file_size INTEGER,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      archived_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `)

  // ─── Migrations: add columns to existing recordings table ───
  const migrations: { column: string; sql: string }[] = [
    { column: 'lifecycle_stage', sql: `ALTER TABLE recordings ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'active'` },
    { column: 'thumbnail_key', sql: `ALTER TABLE recordings ADD COLUMN thumbnail_key TEXT` },
    { column: 'thumbnail_data', sql: `ALTER TABLE recordings ADD COLUMN thumbnail_data TEXT` },
    { column: 'original_file_size', sql: `ALTER TABLE recordings ADD COLUMN original_file_size INTEGER` },
    { column: 'archived_at', sql: `ALTER TABLE recordings ADD COLUMN archived_at INTEGER` },
  ]

  for (const { column, sql } of migrations) {
    try {
      // Check if column exists by querying table_info
      const columns = sqlite.prepare('PRAGMA table_info(recordings)').all() as { name: string }[]
      if (!columns.some(c => c.name === column)) {
        sqlite.exec(sql)
      }
    } catch {
      // Column likely already exists, safe to ignore
    }
  }

  // ─── Default settings ────────────────────────────────────────
  const defaultStoragePath = isDev
    ? path.join(process.env.APP_ROOT!, 'storage')
    : path.join(app.getPath('userData'), 'storage')

  const storedValue = JSON.stringify(defaultStoragePath)

  const now = Date.now()

  sqlite.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run('storage_base_path', storedValue, now)

  sqlite.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run('archive_after_days', JSON.stringify(14), now)

  sqlite.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run('lifecycle_enabled', JSON.stringify(true), now)

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
