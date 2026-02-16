/**
 * LifecycleSettings — Lifecycle configuration UI
 *
 * Toggle auto-archive, configure retention days,
 * and manually trigger archive scan.
 */

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { useLifecycleSettings } from '../hooks/useLifecycleSettings'
import { StorageAnalytics } from './StorageAnalytics'

export function LifecycleSettings() {
  const {
    archiveAfterDays,
    setArchiveAfterDays,
    lifecycleEnabled,
    setLifecycleEnabled,
    loading,
  } = useLifecycleSettings()

  const [archiving, setArchiving] = useState(false)
  const [archiveResult, setArchiveResult] = useState<string | null>(null)
  const [archiveProgress, setArchiveProgress] = useState({ current: 0, total: 0, trackingNumber: '', ffmpegPercent: 0 })

  async function handleRunArchive() {
    setArchiving(true)
    setArchiveResult(null)
    setArchiveProgress({ current: 0, total: 0, trackingNumber: '', ffmpegPercent: 0 })
    try {
      // Force compress: find ALL active recordings (no age filter)
      const result = await window.api.recordings.search({
        lifecycleStage: 'active',
        limit: 10000,
      })

      const eligible = result.recordings.filter(r => r.finishedAt != null)

      if (eligible.length === 0) {
        setArchiveResult('Không có video nào cần nén.')
        return
      }

      let compressed = 0
      for (let i = 0; i < eligible.length; i++) {
        const rec = eligible[i]
        setArchiveProgress({ current: i, total: eligible.length, trackingNumber: rec.trackingNumber, ffmpegPercent: 0 })

        // Poll FFmpeg progress
        const pollHandle = setInterval(async () => {
          try {
            const percent = await window.api.lifecycle.getProgress(rec.id)
            if (percent != null) {
              setArchiveProgress(prev => ({ ...prev, ffmpegPercent: percent }))
            }
          } catch { /* ignore */ }
        }, 500)

        try {
          await window.api.lifecycle.compressVideo({
            recordingId: rec.id,
            fileKey: rec.fileKey,
          })
          compressed++
          setArchiveProgress(prev => ({ ...prev, current: i + 1, ffmpegPercent: 100 }))
        } catch (err) {
          console.error(`[LifecycleSettings] Failed to compress ${rec.id}:`, err)
        } finally {
          clearInterval(pollHandle)
        }
      }

      setArchiveResult(`Đã nén ${compressed}/${eligible.length} video.`)
    } catch (err) {
      console.error('[LifecycleSettings] Archive scan failed:', err)
      setArchiveResult('Lỗi khi chạy nén video.')
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return <div className="text-surface-600 text-sm text-center py-4">Đang tải...</div>
  }

  return (
    <div className="space-y-5">
      {/* Storage analytics dashboard */}
      <StorageAnalytics />

      <div className="border-t border-surface-800" />

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-surface-200 text-sm font-medium">Tự động nén video</p>
          <p className="text-surface-500 text-xs mt-0.5">
            Tự động nén video cũ để tiết kiệm dung lượng
          </p>
        </div>
        <button
          onClick={() => setLifecycleEnabled(!lifecycleEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            lifecycleEnabled ? 'bg-primary-500' : 'bg-surface-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              lifecycleEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Archive after days */}
      <div className={lifecycleEnabled ? '' : 'opacity-40 pointer-events-none'}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-surface-200 text-sm font-medium">
            Nén sau
          </label>
          <span className="text-surface-400 text-xs font-mono">
            {archiveAfterDays} ngày
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-surface-500 text-xs">1</span>
          <input
            type="range"
            min="1"
            max="90"
            step="1"
            value={archiveAfterDays}
            onChange={(e) => setArchiveAfterDays(parseInt(e.target.value, 10))}
            disabled={!lifecycleEnabled}
            className="flex-1 h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <span className="text-surface-500 text-xs">90</span>
        </div>
        <p className="text-surface-600 text-xs mt-1.5">
          Video hoàn thành sau {archiveAfterDays} ngày sẽ được tự động nén thành MP4
        </p>
      </div>

      {/* Manual archive button */}
      <div className="pt-1">
        <button
          onClick={handleRunArchive}
          disabled={archiving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium rounded-lg
            border border-surface-700 transition-colors cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {archiving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {archiving ? 'Đang nén...' : 'Chạy nén ngay'}
        </button>

        {/* Per-video progress during manual compress */}
        {archiving && archiveProgress.total > 0 && (
          <div className="mt-3 p-3 bg-surface-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-surface-400 text-xs">
                {archiveProgress.current}/{archiveProgress.total} video
              </span>
              <span className="text-surface-500 text-xs font-mono">
                {archiveProgress.ffmpegPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-primary-400 rounded-full transition-all duration-300"
                style={{ width: `${archiveProgress.ffmpegPercent}%` }}
              />
            </div>
            {archiveProgress.trackingNumber && (
              <p className="text-surface-500 text-[11px] truncate">
                {archiveProgress.trackingNumber}
              </p>
            )}
          </div>
        )}

        {/* Result message */}
        {archiveResult && (
          <p className={`text-xs mt-2 text-center ${
            archiveResult.startsWith('Lỗi') ? 'text-danger-400' : 'text-surface-400'
          }`}>
            {archiveResult}
          </p>
        )}
      </div>
    </div>
  )
}
