/**
 * Lifecycle Rules — Domain Layer
 *
 * Pure business logic for determining lifecycle transitions.
 * No framework imports — only depends on domain types.
 */

import type { StorageRecording, StorageStats } from '../entities/Recording'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Check if a recording is eligible for archival (compression).
 * Must be 'saved' status, 'active' stage, and older than retention period.
 */
export function isEligibleForArchive(
  recording: StorageRecording,
  retentionDays: number,
  now: Date = new Date(),
): boolean {
  if (recording.status !== 'saved') return false
  if (recording.lifecycleStage !== 'active') return false
  if (!recording.finishedAt) return false

  const ageMs = now.getTime() - recording.finishedAt.getTime()
  const ageDays = ageMs / MS_PER_DAY

  return ageDays >= retentionDays
}

/**
 * Compute storage statistics from a list of recordings.
 */
export function getLifecycleSummary(recordings: StorageRecording[]): StorageStats {
  let totalSize = 0
  let activeSize = 0
  let archivedSize = 0
  let activeCount = 0
  let archivedCount = 0
  let spaceSaved = 0

  for (const rec of recordings) {
    const size = rec.fileSize ?? 0
    totalSize += size

    if (rec.lifecycleStage === 'active') {
      activeSize += size
      activeCount++
    } else {
      archivedSize += size
      archivedCount++
      // Space saved = original size - compressed size
      if (rec.originalFileSize) {
        spaceSaved += rec.originalFileSize - size
      }
    }
  }

  return {
    totalSize,
    activeSize,
    archivedSize,
    totalCount: recordings.length,
    activeCount,
    archivedCount,
    spaceSaved,
  }
}
