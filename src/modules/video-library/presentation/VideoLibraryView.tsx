/**
 * VideoLibraryView — Main video library page
 *
 * Renders the video table with loading, empty, and error states.
 * Includes stats banner, pagination, bulk action bar, delete/compress confirmations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Video, AlertCircle, RotateCcw, Search, Trash2, X,
  AlertTriangle, Loader2, Archive, CheckCircle2,
} from 'lucide-react'
import { useVideoLibrary } from './hooks/useVideoLibrary'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { VideoTable } from './components/VideoTable'
import { VideoLibraryToolbar } from './components/VideoLibraryToolbar'
import { VideoPlayerModal } from './components/VideoPlayerModal'
import { Pagination } from './components/Pagination'
import { formatFileSize } from '../../../shared/lib/format'

export function VideoLibraryView() {
  const {
    recordings,
    total,
    totalPages,
    loading,
    error,
    stats,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    deleteRecordings,
    compressRecordings,
    refresh,
  } = useVideoLibrary()

  const player = useVideoPlayer()

  // ─── Computed: eligible compress count ───────────────────────
  const compressEligibleCount = useMemo(() => {
    return recordings.filter(r => selectedIds.has(r.id) && r.lifecycleStage === 'active').length
  }, [recordings, selectedIds])

  // ─── Bulk delete state ──────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState('')

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    setDeleting(true)
    setDeleteProgress(`Đang xóa 0/${ids.length}...`)

    try {
      const deleted = await deleteRecordings(ids)
      setDeleteProgress(`Đã xóa ${deleted}/${ids.length} video`)
    } catch (err) {
      console.error('[VideoLibraryView] Bulk delete error:', err)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [selectedIds, deleteRecordings])

  // ─── Bulk compress state ────────────────────────────────────
  const [showCompressDialog, setShowCompressDialog] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [compressProgress, setCompressProgress] = useState({ current: 0, total: 0, trackingNumber: '', startTime: 0, ffmpegPercent: 0 })
  const [compressResult, setCompressResult] = useState<{ success: number; failed: number; savedBytes: number } | null>(null)

  const handleBulkCompress = useCallback(async () => {
    const ids = Array.from(selectedIds)
    setCompressing(true)
    setCompressProgress({ current: 0, total: compressEligibleCount, trackingNumber: '', startTime: Date.now(), ffmpegPercent: 0 })
    setCompressResult(null)

    try {
      const result = await compressRecordings(ids, (current, total, trackingNumber, ffmpegPercent) => {
        setCompressProgress(prev => ({ ...prev, current, total, trackingNumber, ffmpegPercent }))
      })
      setCompressResult(result)
    } catch (err) {
      console.error('[VideoLibraryView] Bulk compress error:', err)
    } finally {
      setCompressing(false)
    }
  }, [selectedIds, compressEligibleCount, compressRecordings])

  // Close dialogs on ESC
  useEffect(() => {
    if (!showDeleteDialog && !showCompressDialog) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteDialog && !deleting) setShowDeleteDialog(false)
        if (showCompressDialog && !compressing) {
          setShowCompressDialog(false)
          setCompressResult(null)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showDeleteDialog, showCompressDialog, deleting, compressing])

  // ─── Error state ────────────────────────────────────────────
  if (error && !loading && recordings.length === 0) {
    return (
      <div className="max-w-4xl">
        <PageHeader />
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-10 h-10 text-danger-400 mb-4" />
          <p className="text-surface-300 text-sm font-medium mb-1">Không thể tải danh sách video</p>
          <p className="text-surface-500 text-xs mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty state (no recordings at all, no filters) ────────
  if (!loading && recordings.length === 0 && !error && !hasActiveFilters) {
    return (
      <div className="max-w-4xl">
        <PageHeader />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-surface-600" />
          </div>
          <p className="text-surface-300 text-sm font-medium mb-1">Chưa có video nào</p>
          <p className="text-surface-500 text-xs">Bắt đầu quay video để xem tại đây</p>
        </div>
      </div>
    )
  }

  // ─── Table (with toolbar) ─────────────────────────────────
  return (
    <div className="max-w-6xl">
      <PageHeader total={total} loading={loading} />

      {/* Stats banner */}
      {stats && (
        <div className="text-surface-400 text-xs mb-4 flex items-center gap-1.5">
          <span>Tổng: {stats.totalCount} video ({formatFileSize(stats.totalSize)})</span>
          <span className="text-surface-600">·</span>
          <span>Hoạt động: {stats.activeCount}</span>
          <span className="text-surface-600">·</span>
          <span>Đã nén: {stats.archivedCount}</span>
        </div>
      )}

      <VideoLibraryToolbar
        filters={filters}
        total={total}
        hasActiveFilters={hasActiveFilters}
        onUpdateFilters={updateFilters}
        onResetFilters={resetFilters}
      />

      {/* No results with active filters */}
      {!loading && recordings.length === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-8 h-8 text-surface-600 mb-3" />
          <p className="text-surface-400 text-sm mb-1">Không tìm thấy video nào</p>
          <button
            onClick={resetFilters}
            className="text-primary-400 hover:text-primary-300 text-xs transition-colors cursor-pointer mt-1"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <VideoTable
          recordings={recordings}
          loading={loading}
          selectedIds={selectedIds}
          onRowClick={player.open}
          onToggleSelection={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {/* Pagination */}
      {totalPages > 0 && recordings.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Video playback modal */}
      {player.isOpen && player.recording && (
        <VideoPlayerModal
          recording={player.recording}
          videoUrl={player.videoUrl}
          loading={player.loading}
          error={player.error}
          onClose={player.close}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        compressEligibleCount={compressEligibleCount}
        onDelete={() => setShowDeleteDialog(true)}
        onCompress={() => setShowCompressDialog(true)}
        onDeselect={clearSelection}
      />

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <ConfirmDeleteDialog
          count={selectedIds.size}
          deleting={deleting}
          progress={deleteProgress}
          onConfirm={handleBulkDelete}
          onCancel={() => !deleting && setShowDeleteDialog(false)}
        />
      )}

      {/* Compress confirmation / progress dialog */}
      {showCompressDialog && (
        <CompressDialog
          eligibleCount={compressEligibleCount}
          compressing={compressing}
          progress={compressProgress}
          result={compressResult}
          onConfirm={handleBulkCompress}
          onClose={() => {
            if (!compressing) {
              setShowCompressDialog(false)
              setCompressResult(null)
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function PageHeader({ total, loading }: { total?: number; loading?: boolean }) {
  return (
    <div className="mb-6">
      <h1 className="text-surface-50 text-xl font-bold">Thư viện video</h1>
      <p className="text-surface-500 text-sm mt-1">
        {loading ? 'Đang tải...' : total != null ? `${total} video` : 'Quản lý và xem lại video đóng hàng'}
      </p>
    </div>
  )
}

// ─── Bulk Action Bar ─────────────────────────────────────────

function BulkActionBar({ count, compressEligibleCount, onDelete, onCompress, onDeselect }: {
  count: number
  compressEligibleCount: number
  onDelete: () => void
  onCompress: () => void
  onDeselect: () => void
}) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 border border-surface-800 shadow-2xl rounded-xl px-5 py-3 flex items-center gap-4 z-40 transition-all duration-300 ${
        count > 0
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <span className="text-surface-200 text-sm font-medium whitespace-nowrap">
        Đã chọn {count} video
      </span>

      <div className="w-px h-5 bg-surface-700" />

      <button
        onClick={onCompress}
        disabled={compressEligibleCount === 0}
        title={compressEligibleCount === 0 ? 'Tất cả video đã được nén' : undefined}
        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Archive className="w-4 h-4" />
        Nén video
      </button>

      <button
        onClick={onDelete}
        className="inline-flex items-center gap-2 bg-danger-500 hover:bg-danger-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
        Xóa
      </button>

      <button
        onClick={onDeselect}
        className="inline-flex items-center gap-1.5 text-surface-400 hover:text-surface-200 text-sm transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        Bỏ chọn
      </button>
    </div>
  )
}

// ─── Confirm Delete Dialog ───────────────────────────────────

function ConfirmDeleteDialog({ count, deleting, progress, onConfirm, onCancel }: {
  count: number
  deleting: boolean
  progress: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-surface-900 border border-surface-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {deleting ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-8 h-8 text-danger-400 animate-spin mb-3" />
            <p className="text-surface-200 text-sm font-medium">{progress}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger-400" />
              </div>
              <div>
                <h3 className="text-surface-100 text-base font-semibold">
                  Xác nhận xóa {count} video?
                </h3>
                <p className="text-surface-400 text-sm mt-1">
                  Thao tác này không thể hoàn tác. Video sẽ bị xóa vĩnh viễn khỏi ổ đĩa.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-surface-300 hover:text-surface-100 bg-surface-800 hover:bg-surface-700 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Compress Dialog ─────────────────────────────────────────

function CompressDialog({ eligibleCount, compressing, progress, result, onConfirm, onClose }: {
  eligibleCount: number
  compressing: boolean
  progress: { current: number; total: number; trackingNumber: string; startTime: number; ffmpegPercent: number }
  result: { success: number; failed: number; savedBytes: number } | null
  onConfirm: () => void
  onClose: () => void
}) {
  // Time estimation
  const elapsed = compressing ? (Date.now() - progress.startTime) / 1000 : 0
  const avgPerVideo = progress.current > 0 ? elapsed / progress.current : 0
  const remaining = progress.current > 0 ? Math.ceil(avgPerVideo * (progress.total - progress.current)) : 0
  const remainingMinutes = Math.ceil(remaining / 60)
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface-900 border border-surface-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {result ? (
          // ─── Result ─────────────────────────────────────
          <div className="flex flex-col items-center py-4">
            <CheckCircle2 className="w-10 h-10 text-success-400 mb-3" />
            <p className="text-surface-100 text-base font-semibold mb-1">
              Đã nén {result.success}/{result.success + result.failed} video
            </p>
            {result.savedBytes > 0 && (
              <p className="text-surface-400 text-sm">
                Tiết kiệm {formatFileSize(result.savedBytes)}
              </p>
            )}
            {result.failed > 0 && (
              <p className="text-warning-400 text-sm mt-1">
                {result.failed} video thất bại
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        ) : compressing ? (
          // ─── Progress ───────────────────────────────────
          <div>
            <h3 className="text-surface-100 text-base font-semibold mb-4">Đang nén video</h3>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-surface-300 text-sm font-medium">
                {progress.current}/{progress.total} ({percentage}%)
              </span>
              {remaining > 0 && (
                <span className="text-surface-500 text-xs">
                  Thời gian còn lại: ~{remainingMinutes > 0 ? `${remainingMinutes} phút` : `${remaining} giây`}
                </span>
              )}
            </div>

            {progress.trackingNumber && (
              <div className="mt-3 p-3 bg-surface-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-surface-300 text-xs font-medium truncate">
                    Đang xử lý: <span className="font-mono">{progress.trackingNumber}</span>
                  </p>
                  <span className="text-surface-500 text-xs font-mono ml-2">
                    {progress.ffmpegPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress.ffmpegPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          // ─── Confirmation ───────────────────────────────
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-surface-100 text-base font-semibold">
                  Nén {eligibleCount} video?
                </h3>
                <p className="text-surface-400 text-sm mt-1">
                  Video sẽ được chuyển sang định dạng MP4 nén. Kích thước file có thể giảm 40–60%.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-surface-300 hover:text-surface-100 bg-surface-800 hover:bg-surface-700 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Bắt đầu nén
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
