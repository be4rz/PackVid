/**
 * Storage path resolution — shared helper for IPC handlers.
 *
 * The storage base path lives in `app_settings` under the `storage_base_path`
 * key (JSON-encoded). Recording file keys are persisted as absolute paths, but
 * legacy/relative keys are still resolved against the base path for backward
 * compatibility.
 *
 * This is the single source of truth — storage, thumbnails, and lifecycle
 * handlers all import from here instead of each keeping their own copy.
 */

import path from 'node:path'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { appSettings } from '../../src/db/schema'

/** Resolve the configured storage base path. Throws if not set. */
export function resolveStorageBasePath(): string {
  const db = getDb()
  const rows = db.select().from(appSettings)
    .where(eq(appSettings.key, 'storage_base_path'))
    .all()

  if (rows.length === 0) {
    throw new Error('storage_base_path not configured in app_settings')
  }

  try {
    return JSON.parse(rows[0].value) as string
  } catch {
    return rows[0].value
  }
}

/**
 * Resolve a fileKey to an absolute path.
 * Absolute keys are returned as-is; relative (legacy) keys are joined
 * onto the configured base path.
 */
export function resolveFileKeyPath(fileKey: string): string {
  if (path.isAbsolute(fileKey)) return fileKey
  return path.join(resolveStorageBasePath(), fileKey)
}
