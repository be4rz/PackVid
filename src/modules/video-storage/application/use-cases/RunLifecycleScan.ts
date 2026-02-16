/**
 * RunLifecycleScan Use Case — Application Layer
 *
 * Scans all recordings for lifecycle eligibility and archives those
 * that exceed the retention period. Returns a summary of actions taken.
 */

import type { RecordingRepository } from '../ports/RecordingRepository'
import { ArchiveRecording, type ArchiveRecordingDeps } from './ArchiveRecording'

export interface LifecycleScanResult {
  archived: number
  failed: number
  spaceSaved: number
  errors: Array<{ recordingId: string; error: string }>
}

export class RunLifecycleScan {
  private archiveUseCase: ArchiveRecording

  constructor(
    private repository: RecordingRepository,
    archiveDeps: ArchiveRecordingDeps,
  ) {
    this.archiveUseCase = new ArchiveRecording(archiveDeps)
  }

  async execute(retentionDays: number): Promise<LifecycleScanResult> {
    const eligible = await this.repository.findEligibleForArchive(retentionDays)

    const result: LifecycleScanResult = {
      archived: 0,
      failed: 0,
      spaceSaved: 0,
      errors: [],
    }

    for (const recording of eligible) {
      try {
        const archiveResult = await this.archiveUseCase.execute(recording)
        result.archived++
        result.spaceSaved += archiveResult.spaceSaved
      } catch (err) {
        result.failed++
        result.errors.push({
          recordingId: recording.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return result
  }
}
