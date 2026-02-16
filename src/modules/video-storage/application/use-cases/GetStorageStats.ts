/**
 * GetStorageStats Use Case — Application Layer
 *
 * Retrieves aggregated storage statistics across all recordings.
 */

import type { StorageStats } from '../../domain/entities/Recording'
import type { RecordingRepository } from '../ports/RecordingRepository'

export class GetStorageStats {
  constructor(private repository: RecordingRepository) {}

  async execute(): Promise<StorageStats> {
    return this.repository.getStorageStats()
  }
}
