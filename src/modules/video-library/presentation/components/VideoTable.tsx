/**
 * VideoTable — Recordings data table with selection support
 *
 * Renders a table of recordings with sticky header, loading skeleton,
 * checkbox column for multi-select, and delegates row rendering to VideoRow.
 */

import { useRef, useEffect } from 'react'
import { VideoRow } from './VideoRow'
import type { StorageRecording } from '../../../video-storage/domain/entities/Recording'

interface VideoTableProps {
  recordings: StorageRecording[]
  loading: boolean
  selectedIds: Set<string>
  onRowClick: (recording: StorageRecording) => void
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
}

export function VideoTable({
  recordings,
  loading,
  selectedIds,
  onRowClick,
  onToggleSelection,
  onToggleSelectAll,
}: VideoTableProps) {
  const allSelected = recordings.length > 0 && selectedIds.size === recordings.length
  const someSelected = selectedIds.size > 0 && !allSelected

  // Indeterminate state via ref (can't set via JSX attribute)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-800 bg-surface-900 sticky top-0 z-10">
            <th className="px-4 py-3 w-10">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 accent-primary-500 cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500 w-24" />
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Mã vận đơn</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Hãng vận chuyển</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Thời lượng</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Kích thước</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Trạng thái</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-500">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows count={5} />
          ) : (
            recordings.map(rec => (
              <VideoRow
                key={rec.id}
                recording={rec}
                selected={selectedIds.has(rec.id)}
                onClick={onRowClick}
                onToggle={onToggleSelection}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i} className="border-b border-surface-800">
          <td className="px-4 py-3 w-10">
            <div className="w-4 h-4 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="w-20 h-[60px] rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-40 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 rounded bg-surface-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-surface-800 animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  )
}
