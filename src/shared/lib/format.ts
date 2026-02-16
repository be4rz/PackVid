/**
 * Formatting utilities — shared across modules
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/** Format bytes into human-readable size string (e.g. 1.2 GB, 340 MB) */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const index = Math.min(i, UNITS.length - 1)
  const value = bytes / Math.pow(1024, index)

  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[index]}`
}

/** Format milliseconds as M:SS (e.g. 1:28) */
export function formatDuration(ms?: number): string {
  if (ms == null) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
