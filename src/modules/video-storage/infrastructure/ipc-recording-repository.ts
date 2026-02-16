/**
 * IPC Recording Repository — Infrastructure Layer
 *
 * Implements RecordingRepository port using Electron IPC calls.
 * Runs in the renderer process; delegates to main process IPC handlers.
 *
 * @see src/modules/video-storage/application/ports/RecordingRepository.ts
 */

import type { LifecycleStage } from '../domain/value-objects/LifecycleStage'
import type { StorageRecording, StorageStats } from '../domain/entities/Recording'
import type {
  RecordingRepository,
  RecordingFilter,
  RecordingSearchResult,
} from '../application/ports/RecordingRepository'

/** IPC row type — matches Window.api.recordings.getAll return type */
type IpcRecordingRow = Awaited<ReturnType<typeof window.api.recordings.getAll>>[number]

/** Convert IPC row (timestamps in ms, nulls) to domain entity (Dates, undefineds) */
function toDomain(row: IpcRecordingRow): StorageRecording {
  return {
    id: row.id,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier ?? undefined,
    fileKey: row.fileKey,
    fileSize: row.fileSize ?? undefined,
    duration: row.duration ?? undefined,
    status: row.status as StorageRecording['status'],
    lifecycleStage: (row.lifecycleStage || 'active') as LifecycleStage,
    thumbnailKey: row.thumbnailKey ?? undefined,
    thumbnailData: row.thumbnailData ?? undefined,
    originalFileSize: row.originalFileSize ?? undefined,
    startedAt: new Date(row.startedAt),
    finishedAt: row.finishedAt ? new Date(row.finishedAt) : undefined,
    archivedAt: row.archivedAt ? new Date(row.archivedAt) : undefined,
    createdAt: new Date(row.createdAt),
  }
}

export class IpcRecordingRepository implements RecordingRepository {
  async findEligibleForArchive(retentionDays: number): Promise<StorageRecording[]> {
    // Use search with lifecycle filter — server-side filtering
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
    const result = await window.api.recordings.search({
      lifecycleStage: 'active',
      dateTo: cutoff,
      limit: 10000,
    })

    return result.recordings
      .filter(row => row.finishedAt != null)
      .map(toDomain)
  }

  async updateLifecycleStage(
    ..._args: Parameters<RecordingRepository['updateLifecycleStage']>
  ): Promise<void> {
    // Lifecycle stage updates are handled directly by the lifecycle IPC handler
    // (lifecycle:compressVideo updates the DB row atomically in the main process)
  }

  async updateThumbnailKey(
    ..._args: Parameters<RecordingRepository['updateThumbnailKey']>
  ): Promise<void> {
    // Thumbnail updates are handled directly by the thumbnails IPC handler
    // (thumbnails:generate updates the DB row atomically in the main process)
  }

  async getStorageStats(): Promise<StorageStats> {
    return window.api.recordings.getStats()
  }

  async search(filter: RecordingFilter): Promise<RecordingSearchResult> {
    const result = await window.api.recordings.search({
      dateFrom: filter.dateFrom?.getTime(),
      dateTo: filter.dateTo?.getTime(),
      carrier: filter.carrier,
      trackingNumber: filter.trackingNumber,
      lifecycleStage: filter.lifecycleStage,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder,
      limit: filter.limit,
      offset: filter.offset,
    })

    return {
      recordings: result.recordings.map(toDomain),
      total: result.total,
    }
  }
}
