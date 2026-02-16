/**
 * Recording Repository Port — Application Layer
 *
 * Defines the contract for recording data access with lifecycle capabilities.
 * Infrastructure layer (Drizzle + IPC) provides the implementation.
 *
 * @see src/modules/video-storage/infrastructure/drizzle-recording-repository.ts
 */

import type { LifecycleStage } from '../../domain/value-objects/LifecycleStage'
import type { StorageRecording, StorageStats } from '../../domain/entities/Recording'

export interface RecordingFilter {
  dateFrom?: Date
  dateTo?: Date
  carrier?: string
  trackingNumber?: string
  lifecycleStage?: LifecycleStage
  status?: string
  sortBy?: 'createdAt' | 'fileSize' | 'duration'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface RecordingSearchResult {
  recordings: StorageRecording[]
  total: number
}

export interface RecordingRepository {
  /** Find all recordings eligible for archival */
  findEligibleForArchive(retentionDays: number): Promise<StorageRecording[]>

  /** Update lifecycle stage with archive metadata */
  updateLifecycleStage(
    id: string,
    stage: LifecycleStage,
    archivedAt?: Date,
    originalFileSize?: number,
    newFileSize?: number,
  ): Promise<void>

  /** Update thumbnail key for a recording */
  updateThumbnailKey(id: string, thumbnailKey: string): Promise<void>

  /** Get aggregated storage statistics */
  getStorageStats(): Promise<StorageStats>

  /** Search recordings with filters and pagination */
  search(filter: RecordingFilter): Promise<RecordingSearchResult>
}
