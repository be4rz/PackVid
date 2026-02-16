/**
 * StorageAnalytics — Compression analytics dashboard
 *
 * Shows lifecycle distribution bar, compression savings,
 * and average compression ratio. Designed to sit above
 * the LifecycleSettings controls.
 */

import { Archive, Zap, TrendingDown } from 'lucide-react'
import { useStorageStats } from '../hooks/useStorageStats'
import { formatFileSize } from '../../../../shared/lib/format'

export function StorageAnalytics() {
  const {
    totalSize,
    activeSize,
    archivedSize,
    totalCount,
    activeCount,
    archivedCount,
    spaceSaved,
    loading,
  } = useStorageStats()

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-surface-800 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Compute percentages for distribution bar
  const activePercent = totalSize > 0 ? (activeSize / totalSize) * 100 : 0
  const archivedPercent = totalSize > 0 ? (archivedSize / totalSize) * 100 : 0

  // Average compression ratio: how much space is saved per archived video
  // ratio = (original - compressed) / original = spaceSaved / (archivedSize + spaceSaved)
  const originalArchivedSize = archivedSize + spaceSaved
  const compressionRatio = originalArchivedSize > 0
    ? Math.round((spaceSaved / originalArchivedSize) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Distribution bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-surface-200 text-sm font-medium">Phân bổ dung lượng</span>
          <span className="text-surface-500 text-xs font-mono">{formatFileSize(totalSize)}</span>
        </div>

        {totalSize > 0 ? (
          <>
            <div className="h-3 bg-surface-800 rounded-full overflow-hidden flex">
              {activePercent > 0 && (
                <div
                  className="bg-success-500 transition-all duration-300"
                  style={{ width: `${activePercent}%` }}
                  title={`Hoạt động: ${formatFileSize(activeSize)}`}
                />
              )}
              {archivedPercent > 0 && (
                <div
                  className="bg-primary-500 transition-all duration-300"
                  style={{ width: `${archivedPercent}%` }}
                  title={`Đã nén: ${formatFileSize(archivedSize)}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success-500" />
                <span className="text-surface-400 text-xs">
                  Hoạt động: {activeCount} ({formatFileSize(activeSize)})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-surface-400 text-xs">
                  Đã nén: {archivedCount} ({formatFileSize(archivedSize)})
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-surface-600 text-xs">Chưa có dữ liệu</p>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          icon={<Archive className="w-3.5 h-3.5" />}
          label="Tổng video"
          value={String(totalCount)}
          color="text-surface-300"
        />
        <MetricCard
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Đã tiết kiệm"
          value={spaceSaved > 0 ? formatFileSize(spaceSaved) : '—'}
          color="text-success-400"
        />
        <MetricCard
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          label="Tỉ lệ nén TB"
          value={archivedCount > 0 ? `${compressionRatio}%` : '—'}
          color="text-primary-400"
        />
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-surface-800 rounded-lg px-3 py-2.5">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-surface-100 text-base font-semibold">{value}</p>
    </div>
  )
}
