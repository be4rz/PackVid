/**
 * Recording Entity — Domain Layer
 *
 * Pure TypeScript. NO framework imports (no React, Electron, Drizzle).
 * Represents a video recording of the packing process, linked to a scanned order.
 *
 * @see /src/modules/recording/domain/entities/Recording.ts
 */

/** Recording lifecycle status */
export type RecordingStatus = 'recording' | 'saved' | 'failed'

export interface RecordingProps {
  id: string
  trackingNumber: string
  carrier?: string
  fileKey: string
  fileSize?: number
  duration?: number
  status: RecordingStatus
  startedAt: Date
  finishedAt?: Date
  createdAt: Date
}

export interface CreateRecordingInput {
  id: string
  trackingNumber: string
  carrier?: string
  fileKey: string
}

/**
 * Factory function — creates a new Recording in 'recording' state.
 * Sets startedAt and createdAt to current timestamp.
 */
export function createRecording(input: CreateRecordingInput): RecordingProps {
  const now = new Date()
  return {
    id: input.id,
    trackingNumber: input.trackingNumber,
    carrier: input.carrier,
    fileKey: input.fileKey,
    status: 'recording',
    startedAt: now,
    createdAt: now,
  }
}

/**
 * Reconstitute a Recording from persistence (skip validation).
 * Used by repository/IPC layers when loading from DB.
 */
export function recordingFromPersistence(props: RecordingProps): RecordingProps {
  return { ...props }
}
