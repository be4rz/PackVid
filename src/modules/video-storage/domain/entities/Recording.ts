/**
 * Recording Entity — Video Storage Domain Layer
 *
 * Extends the recording module's entity with lifecycle fields.
 * Pure TypeScript — no framework imports.
 *
 * @see src/modules/recording/domain/entities/Recording.ts (base recording entity)
 */

import type { LifecycleStage } from '../value-objects/LifecycleStage'

export type RecordingStatus = 'recording' | 'saved' | 'failed'

export interface StorageRecording {
  id: string
  trackingNumber: string
  carrier?: string
  fileKey: string
  fileSize?: number
  duration?: number
  status: RecordingStatus
  lifecycleStage: LifecycleStage
  thumbnailKey?: string   // DEPRECATED: file path on disk
  thumbnailData?: string  // base64 data URI for inline display
  originalFileSize?: number
  startedAt: Date
  finishedAt?: Date
  archivedAt?: Date
  createdAt: Date
}

export interface StorageStats {
  totalSize: number
  activeSize: number
  archivedSize: number
  totalCount: number
  activeCount: number
  archivedCount: number
  spaceSaved: number
}
