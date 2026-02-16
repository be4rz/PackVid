/**
 * StorageSettings — Storage configuration UI
 *
 * Shows current storage path, usage stats with visual breakdown,
 * and allows changing the storage directory.
 */

import { FolderOpen } from 'lucide-react'
import { useStorageStats } from '../hooks/useStorageStats'
import { useStoragePath } from '../hooks/useStoragePath'
import { formatFileSize } from '../../../../shared/lib/format'

export function StorageSettings() {
  const { basePath, loading: pathLoading } = useStoragePath()
  const {
    totalSize,
    activeSize,
    archivedSize,
    totalCount,
    activeCount,
    archivedCount,
    spaceSaved,
    loading: statsLoading,
    refresh,
  } = useStorageStats()

  const loading = pathLoading || statsLoading

  // Calculate bar percentages
  const activePercent = totalSize > 0 ? (activeSize / totalSize) * 100 : 0
  const archivedPercent = totalSize > 0 ? (archivedSize / totalSize) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Storage path */}
      <div>
        <label className="block text-surface-200 text-sm font-medium mb-2">
          Thư mục lưu trữ
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5">
            <FolderOpen className="w-4 h-4 text-surface-500 shrink-0" />
            <span className="text-surface-300 text-sm truncate">
              {loading ? '...' : basePath}
            </span>
          </div>
        </div>
      </div>

      {/* Storage stats */}
      {loading ? (
        <div className="text-surface-600 text-sm text-center py-4">Đang tải...</div>
      ) : (
        <>
          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-surface-200 text-sm font-medium">Dung lượng sử dụng</span>
              <span className="text-surface-400 text-xs font-mono">{formatFileSize(totalSize)}</span>
            </div>
            <div className="h-3 bg-surface-800 rounded-full overflow-hidden flex">
              {activePercent > 0 && (
                <div
                  className="bg-success-500 transition-all duration-300"
                  style={{ width: `${activePercent}%` }}
                />
              )}
              {archivedPercent > 0 && (
                <div
                  className="bg-primary-500 transition-all duration-300"
                  style={{ width: `${archivedPercent}%` }}
                />
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
                <span className="text-surface-400 text-xs">
                  Đang hoạt động ({formatFileSize(activeSize)})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <span className="text-surface-400 text-xs">
                  Đã nén ({formatFileSize(archivedSize)})
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Tổng video" value={String(totalCount)} />
            <StatCard label="Đang hoạt động" value={String(activeCount)} />
            <StatCard label="Đã nén" value={String(archivedCount)} />
          </div>

          {/* Space saved */}
          {spaceSaved > 0 && (
            <div className="bg-success-500/10 border border-success-500/20 rounded-lg px-4 py-3">
              <p className="text-success-400 text-xs font-medium">
                Đã tiết kiệm {formatFileSize(spaceSaved)} nhờ nén video
              </p>
            </div>
          )}

          {/* Refresh button */}
          <div className="flex justify-end">
            <button
              onClick={refresh}
              className="text-xs text-surface-400 hover:text-surface-200 transition-colors cursor-pointer"
            >
              Làm mới thống kê
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-800 rounded-lg px-3 py-2.5 text-center">
      <p className="text-surface-100 text-lg font-semibold">{value}</p>
      <p className="text-surface-500 text-[11px] mt-0.5">{label}</p>
    </div>
  )
}
