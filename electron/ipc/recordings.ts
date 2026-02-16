/**
 * Recordings IPC Handlers — Infrastructure Layer
 *
 * Provides CRUD operations on the recordings table
 * via Electron IPC. Renderer calls these through `window.api.recordings.*`.
 *
 * Channels:
 * - recordings:create       — Insert new recording row (status: 'recording')
 * - recordings:update       — Update status, duration, fileSize after save
 * - recordings:getById      — Get single recording by ID
 * - recordings:getAll       — Paginated list (for video library later)
 * - recordings:delete       — Delete recording row + associated file
 * - recordings:getByTracking — Find recording by tracking number
 * - recordings:search        — Search with filters, sorting, pagination
 * - recordings:getStats      — Aggregated storage statistics
 */

import { ipcMain } from 'electron'
import { eq, desc, asc, and, gte, lte, like, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { recordings } from '../../src/db/schema'

/** DTO for creating a new recording */
interface CreateRecordingDTO {
  id: string
  trackingNumber: string
  carrier?: string
  fileKey: string
  status?: string
  startedAt: number   // Unix timestamp (ms)
  createdAt: number    // Unix timestamp (ms)
}

/** DTO for search filters */
interface SearchFiltersDTO {
  dateFrom?: number     // Unix timestamp (ms)
  dateTo?: number       // Unix timestamp (ms)
  carrier?: string
  trackingNumber?: string
  lifecycleStage?: string
  sortBy?: 'createdAt' | 'fileSize' | 'duration'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** DTO for updating a recording */
interface UpdateRecordingDTO {
  status?: string
  fileSize?: number
  duration?: number
  finishedAt?: number  // Unix timestamp (ms)
}

export function registerRecordingsHandlers() {
  // ─── Create a new recording ──────────────────────────────────
  ipcMain.handle('recordings:create', async (_event, data: CreateRecordingDTO) => {
    const db = getDb()
    db.insert(recordings)
      .values({
        id: data.id,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier ?? null,
        fileKey: data.fileKey,
        status: data.status ?? 'recording',
        startedAt: new Date(data.startedAt),
        createdAt: new Date(data.createdAt),
      })
      .run()
  })

  // ─── Update a recording (partial) ────────────────────────────
  ipcMain.handle('recordings:update', async (_event, id: string, data: UpdateRecordingDTO) => {
    const db = getDb()
    const updateSet: Record<string, unknown> = {}

    if (data.status !== undefined) updateSet.status = data.status
    if (data.fileSize !== undefined) updateSet.fileSize = data.fileSize
    if (data.duration !== undefined) updateSet.duration = data.duration
    if (data.finishedAt !== undefined) updateSet.finishedAt = new Date(data.finishedAt)

    if (Object.keys(updateSet).length === 0) return

    db.update(recordings)
      .set(updateSet)
      .where(eq(recordings.id, id))
      .run()
  })

  // ─── Get single recording by ID ──────────────────────────────
  ipcMain.handle('recordings:getById', async (_event, id: string) => {
    const db = getDb()
    const rows = db.select().from(recordings)
      .where(eq(recordings.id, id))
      .all()

    if (rows.length === 0) return null
    return serializeRow(rows[0])
  })

  // ─── Get all recordings (paginated) ──────────────────────────
  ipcMain.handle('recordings:getAll', async (_event, options?: { page?: number; limit?: number }) => {
    const db = getDb()
    const limit = options?.limit ?? 50
    const page = options?.page ?? 1
    const offset = (page - 1) * limit

    const rows = db.select().from(recordings)
      .orderBy(desc(recordings.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    return rows.map(serializeRow)
  })

  // ─── Delete recording row (file deletion handled by storage IPC) ─
  ipcMain.handle('recordings:delete', async (_event, id: string) => {
    const db = getDb()

    // Get the recording first to return fileKey for file cleanup
    const rows = db.select().from(recordings)
      .where(eq(recordings.id, id))
      .all()

    if (rows.length === 0) return null

    const recording = rows[0]

    // Delete from DB
    db.delete(recordings)
      .where(eq(recordings.id, id))
      .run()

    return { fileKey: recording.fileKey }
  })

  // ─── Find recording by tracking number ───────────────────────
  ipcMain.handle('recordings:getByTracking', async (_event, trackingNumber: string) => {
    const db = getDb()
    const rows = db.select().from(recordings)
      .where(eq(recordings.trackingNumber, trackingNumber))
      .all()

    if (rows.length === 0) return null
    return serializeRow(rows[0])
  })

  // ─── Search recordings with filters ─────────────────────────
  ipcMain.handle('recordings:search', async (_event, filters: SearchFiltersDTO) => {
    const db = getDb()
    const conditions = []

    // Only show saved recordings by default
    conditions.push(eq(recordings.status, 'saved'))

    if (filters.carrier) {
      conditions.push(eq(recordings.carrier, filters.carrier))
    }
    if (filters.trackingNumber) {
      conditions.push(like(recordings.trackingNumber, `%${filters.trackingNumber}%`))
    }
    if (filters.lifecycleStage) {
      conditions.push(eq(recordings.lifecycleStage, filters.lifecycleStage))
    }
    if (filters.dateFrom) {
      conditions.push(gte(recordings.createdAt, new Date(filters.dateFrom)))
    }
    if (filters.dateTo) {
      conditions.push(lte(recordings.createdAt, new Date(filters.dateTo)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Sorting
    const sortColumn = filters.sortBy === 'fileSize' ? recordings.fileSize
      : filters.sortBy === 'duration' ? recordings.duration
      : recordings.createdAt
    const orderFn = filters.sortOrder === 'asc' ? asc : desc

    // Count total
    const countResult = db.select({ count: sql<number>`count(*)` })
      .from(recordings)
      .where(whereClause)
      .all()
    const total = countResult[0]?.count ?? 0

    // Fetch page
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0

    const rows = db.select().from(recordings)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)
      .all()

    return { recordings: rows.map(serializeRow), total }
  })

  // ─── Get aggregated storage statistics ──────────────────────
  ipcMain.handle('recordings:getStats', async () => {
    const db = getDb()

    const rows = db.select({
      lifecycleStage: recordings.lifecycleStage,
      count: sql<number>`count(*)`,
      totalSize: sql<number>`coalesce(sum(${recordings.fileSize}), 0)`,
      totalOriginalSize: sql<number>`coalesce(sum(${recordings.originalFileSize}), 0)`,
    })
      .from(recordings)
      .where(eq(recordings.status, 'saved'))
      .groupBy(recordings.lifecycleStage)
      .all()

    let totalSize = 0
    let activeSize = 0
    let archivedSize = 0
    let activeCount = 0
    let archivedCount = 0
    let spaceSaved = 0

    for (const row of rows) {
      totalSize += row.totalSize
      if (row.lifecycleStage === 'archived') {
        archivedSize += row.totalSize
        archivedCount += row.count
        spaceSaved += row.totalOriginalSize - row.totalSize
      } else {
        activeSize += row.totalSize
        activeCount += row.count
      }
    }

    return {
      totalSize,
      activeSize,
      archivedSize,
      totalCount: activeCount + archivedCount,
      activeCount,
      archivedCount,
      spaceSaved,
    }
  })
}

/**
 * Serialize a DB row for IPC transport.
 * Converts Date objects to timestamps (ms) for JSON serialization.
 */
function serializeRow(row: typeof recordings.$inferSelect) {
  return {
    id: row.id,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier,
    fileKey: row.fileKey,
    fileSize: row.fileSize,
    duration: row.duration,
    status: row.status,
    lifecycleStage: row.lifecycleStage,
    thumbnailKey: row.thumbnailKey,
    thumbnailData: row.thumbnailData,
    originalFileSize: row.originalFileSize,
    startedAt: row.startedAt instanceof Date ? row.startedAt.getTime() : row.startedAt,
    finishedAt: row.finishedAt instanceof Date ? row.finishedAt.getTime() : row.finishedAt,
    archivedAt: row.archivedAt instanceof Date ? row.archivedAt.getTime() : row.archivedAt,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
  }
}
