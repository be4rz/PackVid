/**
 * ArchiveRecording Use Case — Application Layer
 *
 * Compresses a single recording from 'active' to 'archived' stage.
 * Validates the recording is eligible, delegates compression to VideoFileService,
 * then updates the DB via lifecycle IPC (handled atomically in main process).
 */

import type { StorageRecording } from '../../domain/entities/Recording'

export interface ArchiveRecordingDeps {
  compressVideo: (data: { recordingId: string; fileKey: string }) => Promise<{
    newFileKey: string
    newFileSize: number
    originalFileSize: number
  }>
}

export interface ArchiveRecordingResult {
  recordingId: string
  originalFileSize: number
  newFileSize: number
  spaceSaved: number
}

export class ArchiveRecording {
  constructor(private deps: ArchiveRecordingDeps) {}

  async execute(recording: StorageRecording): Promise<ArchiveRecordingResult> {
    if (recording.status !== 'saved') {
      throw new Error(`Cannot archive recording ${recording.id}: status is '${recording.status}', expected 'saved'`)
    }

    if (recording.lifecycleStage !== 'active') {
      throw new Error(`Cannot archive recording ${recording.id}: already '${recording.lifecycleStage}'`)
    }

    // Compress video (main process handles DB update atomically)
    const result = await this.deps.compressVideo({
      recordingId: recording.id,
      fileKey: recording.fileKey,
    })

    return {
      recordingId: recording.id,
      originalFileSize: result.originalFileSize,
      newFileSize: result.newFileSize,
      spaceSaved: result.originalFileSize - result.newFileSize,
    }
  }
}
