/**
 * Database Connection — Singleton
 *
 * Creates and exports the Drizzle ORM instance connected to SQLite.
 * This file is imported by Infrastructure layer repository adapters.
 *
 * In Electron production:
 * - The DB file lives in the app's userData directory
 * - Migrations run on app startup via `electron/main.ts`
 *
 * For development (Vite renderer), we use the project root `database/` folder.
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('database/packvid.sqlite')

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })
