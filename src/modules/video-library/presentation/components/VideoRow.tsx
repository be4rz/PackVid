/**
 * VideoRow — Single table row for a recording
 *
 * Displays thumbnail, tracking number, carrier, duration, file size,
 * lifecycle badge, and creation date. Clickable to open video modal.
 */

import { Film } from 'lucide-react'
import { formatFileSize } from '../../../../shared/lib/format'
import type { StorageRecording } from '../../../video-storage/domain/entities/Recording'

/** Carrier display names */
const CARRIER_NAMES: Record<string, string> = {
  SPX: 'SPX Express',
  GHN: 'Giao Hàng Nhanh',
  GHTK: 'Giao Hàng Tiết Kiệm',
}

/** Format seconds as MM:SS */
function formatDuration(ms?: number): string {
  if (ms == null) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Format Date as DD/MM/YYYY HH:mm */
function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const mo = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  const h = date.getHours().toString().padStart(2, '0')
  const mi = date.getMinutes().toString().padStart(2, '0')
  return `${d}/${mo}/${y} ${h}:${mi}`
}

interface VideoRowProps {
  recording: StorageRecording
  selected: boolean
  onClick: (recording: StorageRecording) => void
  onToggle: (id: string) => void
}

export function VideoRow({ recording, selected, onClick, onToggle }: VideoRowProps) {
  return (
    <tr
      onClick={() => onClick(recording)}
      className={`border-b border-surface-800 hover:bg-surface-800/50 transition-colors duration-150 cursor-pointer ${
        selected ? 'bg-primary-500/5' : ''
      }`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(recording.id)}
          className="w-4 h-4 accent-primary-500 cursor-pointer"
        />
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        <Thumbnail thumbnailData={recording.thumbnailData} thumbnailKey={recording.thumbnailKey} />
      </td>

      {/* Tracking number */}
      <td className="px-4 py-3">
        <span className="text-surface-100 text-sm font-medium font-mono">
          {recording.trackingNumber}
        </span>
      </td>

      {/* Carrier */}
      <td className="px-4 py-3">
        <span className="text-surface-400 text-sm">
          {recording.carrier ? (CARRIER_NAMES[recording.carrier] ?? recording.carrier) : '—'}
        </span>
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <span className="text-surface-400 text-sm font-mono">
          {formatDuration(recording.duration)}
        </span>
      </td>

      {/* File size */}
      <td className="px-4 py-3">
        <span className="text-surface-400 text-sm">
          {recording.fileSize ? formatFileSize(recording.fileSize) : '—'}
        </span>
        {recording.lifecycleStage === 'archived' && recording.originalFileSize && recording.fileSize && (
          <span className="block text-surface-600 text-[11px] mt-0.5">
            {formatFileSize(recording.originalFileSize)} → {formatFileSize(recording.fileSize)}
          </span>
        )}
      </td>

      {/* Lifecycle badge */}
      <td className="px-4 py-3">
        <LifecycleBadge stage={recording.lifecycleStage} archivedAt={recording.archivedAt} />
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-surface-500 text-sm">
          {formatDate(recording.createdAt)}
        </span>
      </td>
    </tr>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function Thumbnail({ thumbnailData, thumbnailKey }: { thumbnailData?: string; thumbnailKey?: string }) {
  // Prefer base64 data URI (stored in DB), fallback to file-based thumbnail via media://
  const src = thumbnailData || (thumbnailKey ? `media://${encodeURIComponent(thumbnailKey)}` : null)

  return (
    <div className="w-20 h-[60px] rounded bg-surface-800 border border-surface-700 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <Film className="w-5 h-5 text-surface-600" />
      )}
    </div>
  )
}

function LifecycleBadge({ stage, archivedAt }: { stage: string; archivedAt?: Date }) {
  const isArchived = stage === 'archived'
  return (
    <div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isArchived
          ? 'bg-primary-500/15 text-primary-400'
          : 'bg-success-500/15 text-success-400'
      }`}>
        {isArchived ? 'Đã nén' : 'Hoạt động'}
      </span>
      {isArchived && archivedAt && (
        <span className="block text-surface-600 text-[11px] mt-0.5">
          {formatDate(archivedAt)}
        </span>
      )}
    </div>
  )
}
