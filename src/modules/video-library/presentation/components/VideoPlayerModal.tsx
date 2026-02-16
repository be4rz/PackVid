/**
 * VideoPlayerModal — Full-screen video player with metadata sidebar
 *
 * Renders a modal overlay with native <video> controls and a
 * metadata panel showing recording details. Closes on ESC or backdrop click.
 */

import { useEffect, useRef } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { formatFileSize } from '../../../../shared/lib/format'
import type { StorageRecording } from '../../../video-storage/domain/entities/Recording'

/** Carrier display names */
const CARRIER_NAMES: Record<string, string> = {
  SPX: 'SPX Express',
  GHN: 'Giao Hàng Nhanh',
  GHTK: 'Giao Hàng Tiết Kiệm',
}

interface VideoPlayerModalProps {
  recording: StorageRecording
  videoUrl: string | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function VideoPlayerModal({ recording, videoUrl, loading, error, onClose }: VideoPlayerModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // ESC to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Click backdrop to close
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  const isArchived = recording.lifecycleStage === 'archived'

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        title="Đóng (ESC)"
        className="absolute top-4 right-4 z-10 p-2 bg-surface-800/80 hover:bg-surface-700 text-surface-300 hover:text-white rounded-full transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="text-surface-400 text-sm">Đang tải video...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-danger-400" />
            <p className="text-surface-300 text-sm">{error}</p>
          </div>
        )}

        {videoUrl && !loading && !error && (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Metadata sidebar */}
      <div className="w-80 bg-surface-900 border-l border-surface-800 p-6 overflow-y-auto shrink-0">
        <h3 className="text-surface-100 font-semibold text-sm mb-5">Chi tiết video</h3>

        <div className="space-y-4">
          <MetaField label="Mã vận đơn" value={recording.trackingNumber} mono />

          <MetaField
            label="Hãng vận chuyển"
            value={recording.carrier ? (CARRIER_NAMES[recording.carrier] ?? recording.carrier) : '—'}
          />

          <MetaField label="Trạng thái vòng đời">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isArchived
                ? 'bg-primary-500/15 text-primary-400'
                : 'bg-success-500/15 text-success-400'
            }`}>
              {isArchived ? 'Đã nén' : 'Hoạt động'}
            </span>
          </MetaField>

          <MetaField label="Thời lượng" value={formatDuration(recording.duration)} />

          <MetaField
            label="Kích thước hiện tại"
            value={recording.fileSize ? formatFileSize(recording.fileSize) : '—'}
          />

          {isArchived && recording.originalFileSize && (
            <>
              <MetaField
                label="Kích thước gốc"
                value={formatFileSize(recording.originalFileSize)}
              />
              <MetaField
                label="Tiết kiệm"
                value={formatFileSize(recording.originalFileSize - (recording.fileSize ?? 0))}
              />
            </>
          )}

          <div className="border-t border-surface-800 pt-4 mt-4">
            <MetaField label="Bắt đầu ghi" value={formatDateTime(recording.startedAt)} />
            {recording.finishedAt && (
              <div className="mt-4">
                <MetaField label="Kết thúc ghi" value={formatDateTime(recording.finishedAt)} />
              </div>
            )}
            {isArchived && recording.archivedAt && (
              <div className="mt-4">
                <MetaField label="Ngày lưu trữ" value={formatDateTime(recording.archivedAt)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components & helpers ────────────────────────────────

function MetaField({ label, value, mono, children }: {
  label: string
  value?: string
  mono?: boolean
  children?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-surface-500 text-xs mb-1">{label}</p>
      {children ?? (
        <p className={`text-surface-200 text-sm ${mono ? 'font-mono' : ''}`}>
          {value ?? '—'}
        </p>
      )}
    </div>
  )
}

function formatDuration(ms?: number): string {
  if (ms == null) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDateTime(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const mo = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  const h = date.getHours().toString().padStart(2, '0')
  const mi = date.getMinutes().toString().padStart(2, '0')
  return `${d}/${mo}/${y} ${h}:${mi}`
}
